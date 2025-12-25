package model

import (
	db "lunar/internal/db/sqlc"

	"github.com/google/uuid"
)

type User struct {
	ID            uuid.UUID `json:"id"`
	Username      string    `json:"username"`
	Email         string    `json:"email"`
	AvatarURL     string    `json:"avatarUrl"`
	EmailVerified bool      `json:"emailVerified"`
}

func UserFromRepo(user db.User) User {
	return User{
		ID:            user.ID,
		Username:      user.Username,
		Email:         user.Email,
		AvatarURL:     user.AvatarUrl.String,
		EmailVerified: user.EmailVerified,
	}
}
