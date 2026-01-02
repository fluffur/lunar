package repository

import (
	"context"
	"errors"
	"lunar/internal/model"

	"github.com/google/uuid"
)

var ErrUniqueAlreadyExists = errors.New("value already exists for unique field")

type UserRepository interface {
	GetByID(ctx context.Context, id uuid.UUID) (model.User, error)
	GetByLogin(ctx context.Context, login string) (model.User, error)
	ChangeAvatar(ctx context.Context, id uuid.UUID, url string) error
	UpdateEmail(ctx context.Context, id uuid.UUID, email string) error
	UpdatePassword(ctx context.Context, id uuid.UUID, newPasswordHash string) error
	CheckUsernameExists(ctx context.Context, username string) (bool, error)
	CheckEmailExists(ctx context.Context, email string) (bool, error)
	Create(ctx context.Context, u model.User) (model.User, error)
}
