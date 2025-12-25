package auth

import (
	"github.com/golang-jwt/jwt/v5"
)

type UserClaims struct {
	Email           string `json:"email"`
	IsVerifiedEmail bool   `json:"isVerifiedEmail"`

	jwt.RegisteredClaims
}
