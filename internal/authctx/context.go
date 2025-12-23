package authctx

import (
	"context"
	repo "lunar/internal/adapters/postgresql/sqlc"

	"github.com/google/uuid"
)

type contextKey string

const UserIDKey = contextKey("userID")

func UserFromContext(ctx context.Context) repo.User {
	user, ok := ctx.Value(UserIDKey).(repo.User)
	if !ok {
		panic("User not found in context. Make sure middleware ran")
	}
	return user
}

func UserIDFromContext(ctx context.Context) uuid.UUID {
	userID, ok := ctx.Value(UserIDKey).(uuid.UUID)
	if !ok {
		panic("User ID not found in context. Make sure middleware ran")
	}
	return userID
}
