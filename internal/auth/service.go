package auth

import (
	"context"
	"errors"
	sqlc "lunar/internal/adapters/postgresql/sqlc"
	"time"

	"github.com/golang-jwt/jwt/v5"
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
	q              *sqlc.Queries
	db             *pgxpool.Pool
	authenticator  Authenticator
	refreshService RefreshService
	accessTTL      time.Duration
	issuer         string
}

func NewService(
	q *sqlc.Queries,
	db *pgxpool.Pool,
	authenticator Authenticator,
	refreshService RefreshService,
	accessTTL time.Duration,
	issuer string,
) *Service {
	return &Service{
		q:              q,
		db:             db,
		authenticator:  authenticator,
		refreshService: refreshService,
		accessTTL:      accessTTL,
		issuer:         issuer,
	}
}

func (s *Service) Register(ctx context.Context, credentials registerCredentials) (authTokens, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return authTokens{}, err
	}
	defer tx.Rollback(ctx)

	qtx := s.q.WithTx(tx)

	if exists, err := qtx.UserWithUsernameExists(ctx, credentials.Username); err != nil {
		return authTokens{}, err
	} else if exists {
		return authTokens{}, ErrUsernameExists
	}

	if exists, err := qtx.UserWithEmailExists(ctx, credentials.Email); err != nil {
		return authTokens{}, err
	} else if exists {
		return authTokens{}, ErrInvalidEmail
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(credentials.Password), bcrypt.DefaultCost)
	if err != nil {
		return authTokens{}, err
	}

	userID, err := qtx.CreateUser(ctx, sqlc.CreateUserParams{
		Username: credentials.Username,
		Email:    credentials.Email,
		PasswordHash: pgtype.Text{
			String: string(hashedPassword),
			Valid:  true,
		},
	})
	if err != nil {
		return authTokens{}, err
	}

	claims := s.accessClaims(userID)

	accessToken, err := s.authenticator.GenerateToken(claims)
	if err != nil {
		return authTokens{}, err
	}
	refreshToken, err := s.refreshService.Issue(ctx, userID)
	if err != nil {
		return authTokens{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return authTokens{}, err
	}

	return authTokens{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *Service) Login(ctx context.Context, credentials loginCredentials) (authTokens, error) {
	user, err := s.q.GetUserByLogin(ctx, credentials.Login)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return authTokens{}, ErrInvalidCredentials
		}
		return authTokens{}, err
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash.String), []byte(credentials.Password))
	if err != nil {
		return authTokens{}, ErrInvalidCredentials
	}

	claims := s.accessClaims(user.ID)

	accessToken, err := s.authenticator.GenerateToken(claims)
	if err != nil {
		return authTokens{}, err
	}
	refreshToken, err := s.refreshService.Issue(ctx, user.ID)
	if err != nil {
		return authTokens{}, err
	}

	return authTokens{
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

func (s *Service) Refresh(ctx context.Context, refreshToken string) (authTokens, error) {
	userID, err := s.refreshService.Consume(ctx, refreshToken)
	if err != nil {
		return authTokens{}, err
	}

	claims := s.accessClaims(userID)

	newAccessToken, err := s.authenticator.GenerateToken(claims)
	if err != nil {
		return authTokens{}, err
	}
	newRefreshToken, err := s.refreshService.Issue(ctx, userID)
	if err != nil {
		return authTokens{}, err
	}

	return authTokens{
		AccessToken:  newAccessToken,
		RefreshToken: newRefreshToken,
	}, nil
}

func (s *Service) accessClaims(userID uuid.UUID) jwt.MapClaims {
	now := time.Now()
	return jwt.MapClaims{
		"sub": userID.String(),
		"iss": s.issuer,
		"iat": jwt.NewNumericDate(now).Unix(),
		"exp": jwt.NewNumericDate(now.Add(s.accessTTL)).Unix(),
	}
}
