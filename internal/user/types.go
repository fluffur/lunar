package user

import (
	"context"
	"errors"
	"lunar/internal/infrastructure/db/sqlc"
	"time"

	"github.com/google/uuid"
)

var (
	ErrEmailAlreadyExists     = errors.New("email already exists")
	ErrEmailAlreadyVerified   = errors.New("email already verified")
	ErrInvalidCurrentPassword = errors.New("invalid current password")
	ErrInvalidImage           = errors.New("invalid image")
	ErrUploadAvatar           = errors.New("failed to upload avatar")
)

type VerificationCodeRepository interface {
	SaveVerificationCode(
		ctx context.Context,
		userID uuid.UUID,
		codeHash []byte,
		expiresAt time.Time,
	) error

	GetVerificationCode(
		ctx context.Context,
		userID uuid.UUID,
	) (*sqlc.EmailVerificationCode, error)

	IncrementAttempts(
		ctx context.Context,
		userID uuid.UUID,
	) error

	Delete(
		ctx context.Context,
		userID uuid.UUID,
	) error
}

type updateEmailRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type updatePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" validate:"required,min=6"`
	NewPassword     string `json:"newPassword" validate:"required,min=6"`
}

type sendVerificationCodeRequest struct {
	Email string `json:"email" validate:"required,email"`
}
