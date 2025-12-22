package user

import (
	repo "lunar/internal/adapters/postgresql/sqlc"
)

func FromRepo(user repo.User) User {
	return User{
		ID:        user.ID,
		Username:  user.Username,
		Email:     user.Email,
		AvatarURL: user.AvatarUrl.String,
	}
}
