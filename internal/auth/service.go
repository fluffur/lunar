package auth

import (
	"context"
	"errors"
	"lunar/internal/model"
	"lunar/internal/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUsernameExists     = errors.New("username already taken")
	ErrInvalidEmail       = errors.New("email is invalid or already taken")
	ErrInvalidCredentials = errors.New("invalid credentials")
)

type Service struct {
	authenticator *Authenticator
	userRepo      repository.UserRepository
	refreshRepo   repository.RefreshTokenRepository
}

func NewService(authenticator *Authenticator, refreshService repository.RefreshTokenRepository, userRepo repository.UserRepository) *Service {
	return &Service{
		authenticator: authenticator,
		refreshRepo:   refreshService,
		userRepo:      userRepo,
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

	claims := s.authenticator.GenerateClaims(createdUser)

	accessToken, err := s.authenticator.GenerateToken(claims)
	if err != nil {
		return Tokens{}, err
	}
	refreshToken, err := s.refreshRepo.Issue(ctx, createdUser.ID)
	if err != nil {
		return Tokens{}, err
	}

	return Tokens{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
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
