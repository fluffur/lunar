package ctx

import (
	"context"
	"net/http"

	"github.com/google/uuid"
)

type contextKey string

const UserCtxKey = contextKey("user")

type UserContext struct {
	ID              uuid.UUID
	Email           string
	IsVerifiedEmail bool
}

func UserFromRequest(r *http.Request) *UserContext {
	ctx := r.Context()
	user, ok := ctx.Value(UserCtxKey).(*UserContext)
	if !ok {
		panic("User not found in context. Make sure middleware ran")
	}
	return user

}

func UserIDFromContext(ctx context.Context) uuid.UUID {
	userID, ok := ctx.Value(UserCtxKey).(uuid.UUID)
	if !ok {
		panic("User ID not found in context. Make sure middleware ran")
	}
	return userID
}
