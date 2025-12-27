package auth

import (
	"context"

	"github.com/google/uuid"
)

type RegisterCredentials struct {
	Username        string `json:"username" validator:"required,min=3,alphanum"`
	Email           string `json:"email" validator:"required,email"`
	Password        string `json:"password" validator:"required,min=6"`
	ConfirmPassword string `json:"confirmPassword" validator:"required,min=6"`
}

type LoginCredentials struct {
	Login    string `json:"login" validator:"required,min=3"`
	Password string `json:"password" validator:"required,min=6,max=72"`
}

type Tokens struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}

type RefreshTokenRepository interface {
	Issue(ctx context.Context, userID uuid.UUID) (string, error)
	Consume(ctx context.Context, token string) (uuid.UUID, error)
	Revoke(ctx context.Context, token string) error
	RevokeAll(ctx context.Context, userID uuid.UUID) error
}
