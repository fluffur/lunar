package user

import (
	"errors"
	"lunar/internal/model"
)

var (
	ErrEmailAlreadyExists     = errors.New("email already exists")
	ErrEmailAlreadyVerified   = errors.New("email already verified")
	ErrInvalidCurrentPassword = errors.New("invalid current password")
	ErrInvalidImage           = errors.New("invalid image")
	ErrUploadAvatar           = errors.New("failed to upload avatar")
)

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

type UserSuccessResponse struct {
	Success bool       `json:"success" default:"true"`
	Data    model.User `json:"data"`
}
