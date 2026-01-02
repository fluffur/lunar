package repository

import (
	"context"

	"github.com/google/uuid"
)

type RefreshTokenRepository interface {
	Issue(ctx context.Context, userID uuid.UUID) (string, error)
	Consume(ctx context.Context, token string) (uuid.UUID, error)
	Revoke(ctx context.Context, token string) error
	RevokeAll(ctx context.Context, userID uuid.UUID) error
}
