package user

import (
	"context"
	repo "lunar/internal/adapters/postgresql/sqlc"
	"mime/multipart"

	"github.com/google/uuid"
)

type Service interface {
	GetUser(ctx context.Context, id uuid.UUID) (repo.User, error)
	UpdateEmail(ctx context.Context, id uuid.UUID, email string) error
	UpdatePassword(ctx context.Context, id uuid.UUID, oldPassword, newPassword string) error
	UploadAvatar(file multipart.File, filename string) (string, error)
	UpdateAvatar(ctx context.Context, id uuid.UUID, url string) error
}

type updateEmailRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type updatePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" validate:"required,min=6"`
	NewPassword     string `json:"newPassword" validate:"required,min=6"`
}
