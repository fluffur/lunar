package auth

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"lunar/internal/model"
	"lunar/internal/notification"
	"lunar/internal/repository"
	"math/big"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUsernameExists     = errors.New("username already taken")
	ErrInvalidEmail       = errors.New("email is invalid or already taken")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrEmailNotVerified   = errors.New("email not verified")
	ErrTooManyAttempts    = errors.New("too many attempts")
)

type Service struct {
	authenticator *Authenticator
	userRepo      repository.UserRepository
	refreshRepo   repository.RefreshTokenRepository
	emailSender   notification.EmailSender
}

func NewService(authenticator *Authenticator, refreshService repository.RefreshTokenRepository, userRepo repository.UserRepository, emailSender notification.EmailSender) *Service {
	return &Service{
		authenticator: authenticator,
		refreshRepo:   refreshService,
		userRepo:      userRepo,
		emailSender:   emailSender,
	}
}

func (s *Service) Register(ctx context.Context, credentials RegisterCredentials) (Tokens, error) {

	if exists, err := s.userRepo.CheckUsernameExists(ctx, credentials.Username); err != nil {
		return Tokens{}, err
	} else if exists {
		return Tokens{}, ErrUsernameExists
	}

	if exists, err := s.userRepo.CheckEmailExists(ctx, credentials.Email); err != nil {
		return Tokens{}, err
	} else if exists {
		return Tokens{}, ErrInvalidEmail
	}

	newUser, err := model.NewUser(credentials.Username, credentials.Email, credentials.Password)
	if err != nil {
		return Tokens{}, err
	}

	createdUser, err := s.userRepo.Create(ctx, newUser)
	if err != nil {
		return Tokens{}, err
	}

	if err := s.sendVerificationCode(ctx, createdUser.ID, createdUser.Email); err != nil {
		return Tokens{}, fmt.Errorf("failed to send verification code: %w", err)
	}

	return Tokens{}, nil
}

func (s *Service) sendVerificationCode(ctx context.Context, userID uuid.UUID, email string) error {
	code := s.generateVerificationCode()
	hashedCode, err := bcrypt.GenerateFromPassword([]byte(code), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	if err := s.userRepo.SaveVerificationCode(ctx, userID, email, string(hashedCode), "15m"); err != nil {
		return err
	}

	return s.emailSender.SendVerificationCode(ctx, email, code)
}

func (s *Service) generateVerificationCode() string {
	n, err := rand.Int(rand.Reader, big.NewInt(1000000))
	if err != nil {
		return "000000"
	}
	return fmt.Sprintf("%06d", n)
}

func (s *Service) SendEmailChangeVerification(ctx context.Context, userID uuid.UUID, newEmail string) error {
	return s.sendVerificationCode(ctx, userID, newEmail)
}

func (s *Service) ResendVerificationEmail(ctx context.Context, email string) error {
	user, err := s.userRepo.GetByLogin(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrInvalidEmail
		}
		return err
	}

	if user.EmailVerified {
		return repository.ErrUniqueAlreadyExists
	}

	return s.sendVerificationCode(ctx, user.ID, user.Email)
}

func (s *Service) VerifyEmail(ctx context.Context, email, code string) error {
	storedCode, err := s.userRepo.GetVerificationCodeByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrInvalidEmail
		}
		return err
	}

	user, err := s.userRepo.GetByID(ctx, storedCode.UserID)
	if err != nil {
		return err
	}

	if storedCode.Attempts >= 5 {
		return ErrTooManyAttempts
	}

	if time.Now().After(storedCode.ExpiresAt) {
		return errors.New("code expired")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(storedCode.CodeHash), []byte(code)); err != nil {
		_ = s.userRepo.IncrementVerificationAttempts(ctx, user.ID)
		return errors.New("invalid code")
	}

	if err := s.userRepo.MarkEmailVerified(ctx, user.ID); err != nil {
		return err
	}

	if storedCode.PendingEmail != "" && storedCode.PendingEmail != user.Email {
		return s.userRepo.UpdateEmail(ctx, user.ID, storedCode.PendingEmail)
	}

	return nil
}

func (s *Service) Login(ctx context.Context, credentials LoginCredentials) (Tokens, error) {
	u, err := s.userRepo.GetByLogin(ctx, credentials.Login)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Tokens{}, ErrInvalidCredentials
		}
		return Tokens{}, err
	}

	err = bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(credentials.Password))
	if err != nil {
		return Tokens{}, ErrInvalidCredentials
	}

	if !u.EmailVerified {
		return Tokens{}, ErrEmailNotVerified
	}

	claims := s.authenticator.GenerateClaims(u)

	accessToken, err := s.authenticator.GenerateToken(claims)
	if err != nil {
		return Tokens{}, err
	}
	refreshToken, err := s.refreshRepo.Issue(ctx, u.ID)
	if err != nil {
		return Tokens{}, err
	}

	return Tokens{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *Service) Logout(ctx context.Context, refreshToken string) error {
	return s.refreshRepo.Revoke(ctx, refreshToken)
}

func (s *Service) LogoutAll(ctx context.Context, userID uuid.UUID) error {
	return s.refreshRepo.RevokeAll(ctx, userID)
}

func (s *Service) Refresh(ctx context.Context, refreshToken string) (Tokens, error) {
	userID, err := s.refreshRepo.Consume(ctx, refreshToken)
	if err != nil {
		return Tokens{}, err
	}

	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return Tokens{}, err
	}

	claims := s.authenticator.GenerateClaims(user)

	newAccessToken, err := s.authenticator.GenerateToken(claims)
	if err != nil {
		return Tokens{}, err
	}
	newRefreshToken, err := s.refreshRepo.Issue(ctx, userID)
	if err != nil {
		return Tokens{}, err
	}

	return Tokens{
		AccessToken:  newAccessToken,
		RefreshToken: newRefreshToken,
	}, nil
}
