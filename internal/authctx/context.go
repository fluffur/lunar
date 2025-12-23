package authctx

import (
	"context"

	"github.com/google/uuid"
)

type contextKey string

const UserIDKey = contextKey("userID")

func UserIDFromContext(ctx context.Context) uuid.UUID {
	userID, ok := ctx.Value(UserIDKey).(uuid.UUID)
	if !ok {
		panic("User ID not found in context. Make sure middleware ran")
	}
	return userID
}
