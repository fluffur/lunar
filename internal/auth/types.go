package auth

import (
	"context"

	"github.com/google/uuid"
)

type Service interface {
	Login(ctx context.Context, credentials loginCredentials) (authTokens, error)
	Register(ctx context.Context, credentials registerCredentials) (authTokens, error)
	Logout(ctx context.Context, refreshToken string) error
	LogoutAll(ctx context.Context, userID uuid.UUID) error
	Refresh(ctx context.Context, refreshToken string) (authTokens, error)
}

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
