package user

import (
	"errors"
)

var (
	ErrEmailAlreadyExists     = errors.New("email already exists")
	ErrEmailAlreadyVerified   = errors.New("email already verified")
	ErrInvalidCurrentPassword = errors.New("invalid current password")
	ErrInvalidImage           = errors.New("invalid image")
	ErrUploadAvatar           = errors.New("failed to upload avatar")
)

type UpdateEmailRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type UpdatePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" validate:"required,min=6"`
	NewPassword     string `json:"newPassword" validate:"required,min=6"`
}

type SendVerificationCodeRequest struct {
	Email string `json:"email" validate:"required,email"`
}
