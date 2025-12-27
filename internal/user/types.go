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

type updateEmailRequest struct {
	Email string `json:"email" validator:"required,email"`
}

type updatePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" validator:"required,min=6"`
	NewPassword     string `json:"newPassword" validator:"required,min=6"`
}

type sendVerificationCodeRequest struct {
	Email string `json:"email" validator:"required,email"`
}
