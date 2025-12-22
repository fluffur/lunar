package auth

import (
	"context"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Authenticator interface {
	GenerateToken(claims jwt.Claims) (string, error)
	ValidateToken(token string) (*jwt.Token, error)
}

type RefreshService interface {
	Issue(ctx context.Context, userID uuid.UUID) (string, error)
	Consume(ctx context.Context, token string) (uuid.UUID, error)
	Revoke(ctx context.Context, token string) error
	RevokeAll(ctx context.Context, userID uuid.UUID) error
}
