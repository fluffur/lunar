package model

import (
	db "lunar/internal/db/postgres/sqlc"

	"github.com/google/uuid"
)

type User struct {
	ID            uuid.UUID `json:"id" binding:"required"`
	Username      string    `json:"username" binding:"required"`
	Email         string    `json:"email" binding:"required"`
	AvatarURL     string    `json:"avatarUrl" binding:"required"`
	EmailVerified bool      `json:"emailVerified" binding:"required"`
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
