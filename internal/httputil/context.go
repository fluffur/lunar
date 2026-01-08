package httputil

import (
	"context"
	"net/http"

	"github.com/google/uuid"
)

type userContextKeyType struct{}

var userContextKey = userContextKeyType{}

type UserContext struct {
	ID              uuid.UUID
	Email           string
	IsVerifiedEmail bool
}

func WithUser(ctx context.Context, user *UserContext) context.Context {
	return context.WithValue(ctx, userContextKey, user)
}

func userFromContext(ctx context.Context) (*UserContext, bool) {
	user, ok := ctx.Value(userContextKey).(*UserContext)
	return user, ok
}

func UserFromRequest(r *http.Request) *UserContext {
	user, ok := userFromContext(r.Context())
	if !ok {
		panic("user not found in context - ensure auth middleware is applied")
	}
	return user
}
