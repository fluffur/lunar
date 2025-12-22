package user

import (
	"context"
	repo "lunar/internal/adapters/postgresql/sqlc"
	"mime/multipart"

	"github.com/google/uuid"
)

type Service interface {
	GetUser(ctx context.Context, id uuid.UUID) (repo.User, error)
	UpdateAvatar(ctx context.Context, id uuid.UUID, url string) error
	UpdateEmail(ctx context.Context, id uuid.UUID, email string) error
	UploadAvatar(ctx context.Context, userID uuid.UUID, file multipart.File, filename string) (string, error)
}

type updateEmailRequest struct {
	Email string `json:"email" validate:"required,email"`
}
