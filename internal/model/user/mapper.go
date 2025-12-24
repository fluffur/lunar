package user

import (
	"lunar/internal/adapters/postgresql/sqlc"
)

func FromRepo(user sqlc.User) User {
	return User{
		ID:            user.ID,
		Username:      user.Username,
		Email:         user.Email,
		AvatarURL:     user.AvatarUrl.String,
		EmailVerified: user.EmailVerified,
	}
}
