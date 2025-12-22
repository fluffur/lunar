package authctx

import (
	"context"
	repo "lunar/internal/adapters/postgresql/sqlc"
)

type contextKey string

const UserKey = contextKey("user")

func UserFromContext(ctx context.Context) repo.User {
	user, ok := ctx.Value(UserKey).(repo.User)
	if !ok {
		panic("User not found in context. Make sure middleware ran")
	}
	return user
}
