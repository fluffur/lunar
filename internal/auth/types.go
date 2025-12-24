package auth

import (
	"context"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type registerCredentials struct {
	Username        string `json:"username" validate:"required,min=3,alphanum"`
	Email           string `json:"email" validate:"required,email"`
	Password        string `json:"password" validate:"required,min=6"`
	ConfirmPassword string `json:"confirmPassword" validate:"required,min=6"`
}

type loginCredentials struct {
	Login    string `json:"login" validate:"required,min=3"`
	Password string `json:"password" validate:"required,min=6,max=72"`
}

type authTokens struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}

type Authenticator interface {
	GenerateToken(claims jwt.Claims) (string, error)
	ValidateToken(token string) (*jwt.Token, error)
}

type RefreshTokenRepository interface {
	Issue(ctx context.Context, userID uuid.UUID) (string, error)
	Consume(ctx context.Context, token string) (uuid.UUID, error)
	Revoke(ctx context.Context, token string) error
	RevokeAll(ctx context.Context, userID uuid.UUID) error
}
