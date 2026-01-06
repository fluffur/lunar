package model

import (
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID            uuid.UUID `json:"id" binding:"required"`
	Username      string    `json:"username" binding:"required"`
	Email         string    `json:"email" binding:"required"`
	PasswordHash  string    `json:"-"`
	AvatarURL     string    `json:"avatarUrl"`
	EmailVerified bool      `json:"emailVerified" binding:"required"`
	CreatedAt     time.Time `json:"-" `
}

func NewUser(username, email, password string, emailVerified bool) (User, error) {
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return User{}, err
	}

	return User{
		ID:            uuid.Must(uuid.NewV7()),
		Username:      username,
		Email:         email,
		PasswordHash:  string(passwordHash),
		EmailVerified: emailVerified,
		CreatedAt:     time.Now(),
	}, nil
}

func (u *User) ComparePasswords(password string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
}

func (u *User) ChangePassword(newPassword string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.PasswordHash = string(hash)
	return nil
}

type EmailVerificationCode struct {
	UserID       uuid.UUID
	CodeHash     string
	PendingEmail string
	ExpiresAt    time.Time
	Attempts     int
	CreatedAt    time.Time
}
