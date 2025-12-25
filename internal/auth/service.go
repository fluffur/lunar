package auth

import (
	"context"
	"errors"
	"lunar/internal/db/sqlc"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUsernameExists     = errors.New("username already taken")
	ErrInvalidEmail       = errors.New("email is invalid or already taken ")
	ErrInvalidCredentials = errors.New("invalid credentials")
)

type Service struct {
	queries        *sqlc.Queries
	db             *pgxpool.Pool
	authenticator  *Authenticator
	refreshService RefreshTokenRepository
}

func NewService(
	queries *sqlc.Queries,
	db *pgxpool.Pool,
	authenticator *Authenticator,
	refreshService RefreshTokenRepository,
) *Service {
	return &Service{
		queries:        queries,
		db:             db,
		authenticator:  authenticator,
		refreshService: refreshService,
	}
}

func (s *Service) Register(ctx context.Context, credentials registerCredentials) (Tokens, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return Tokens{}, err
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	if exists, err := qtx.UserWithUsernameExists(ctx, credentials.Username); err != nil {
		return Tokens{}, err
	} else if exists {
		return Tokens{}, ErrUsernameExists
	}

	if exists, err := qtx.UserWithEmailExists(ctx, credentials.Email); err != nil {
		return Tokens{}, err
	} else if exists {
		return Tokens{}, ErrInvalidEmail
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(credentials.Password), bcrypt.DefaultCost)
	if err != nil {
		return Tokens{}, err
	}

	user, err := qtx.CreateUser(ctx, sqlc.CreateUserParams{
		Username: credentials.Username,
		Email:    credentials.Email,
		PasswordHash: pgtype.Text{
			String: string(hashedPassword),
			Valid:  true,
		},
	})
	if err != nil {
		return Tokens{}, err
	}

	claims := s.authenticator.GenerateClaims(user.ID, user.Email, user.EmailVerified)

	accessToken, err := s.authenticator.GenerateToken(claims)
	if err != nil {
		return Tokens{}, err
	}
	refreshToken, err := s.refreshService.Issue(ctx, user.ID)
	if err != nil {
		return Tokens{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Tokens{}, err
	}

	return Tokens{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *Service) Login(ctx context.Context, credentials loginCredentials) (Tokens, error) {
	user, err := s.queries.GetUserByLogin(ctx, credentials.Login)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Tokens{}, ErrInvalidCredentials
		}
		return Tokens{}, err
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash.String), []byte(credentials.Password))
	if err != nil {
		return Tokens{}, ErrInvalidCredentials
	}

	claims := s.authenticator.GenerateClaims(user.ID, user.Email, user.EmailVerified)

	accessToken, err := s.authenticator.GenerateToken(claims)
	if err != nil {
		return Tokens{}, err
	}
	refreshToken, err := s.refreshService.Issue(ctx, user.ID)
	if err != nil {
		return Tokens{}, err
	}

	return Tokens{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *Service) Logout(ctx context.Context, refreshToken string) error {
	return s.refreshService.Revoke(ctx, refreshToken)
}

func (s *Service) LogoutAll(ctx context.Context, userID uuid.UUID) error {
	return s.refreshService.RevokeAll(ctx, userID)
}

func (s *Service) Refresh(ctx context.Context, refreshToken string) (Tokens, error) {
	userID, err := s.refreshService.Consume(ctx, refreshToken)
	if err != nil {
		return Tokens{}, err
	}

	user, err := s.queries.GetUser(ctx, userID)
	if err != nil {
		return Tokens{}, err
	}

	claims := s.authenticator.GenerateClaims(user.ID, user.Email, user.EmailVerified)

	newAccessToken, err := s.authenticator.GenerateToken(claims)
	if err != nil {
		return Tokens{}, err
	}
	newRefreshToken, err := s.refreshService.Issue(ctx, userID)
	if err != nil {
		return Tokens{}, err
	}

	return Tokens{
		AccessToken:  newAccessToken,
		RefreshToken: newRefreshToken,
	}, nil
}
