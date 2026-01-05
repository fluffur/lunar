package auth

import (
	"fmt"
	model "lunar/internal/model"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Authenticator struct {
	secret    string
	issuer    string
	accessTTL time.Duration
}

func NewJWTAuthenticator(secret, issuer string, accessTTL time.Duration) *Authenticator {
	return &Authenticator{secret, issuer, accessTTL}
}

func (a *Authenticator) GenerateClaims(u model.User) *UserClaims {
	now := time.Now()

	return &UserClaims{
		Email:           u.Email,
		IsVerifiedEmail: u.EmailVerified,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    a.issuer,
			Subject:   u.ID.String(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(a.accessTTL)),
		},
	}
}

func (a *Authenticator) GenerateToken(claims jwt.Claims) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	tokenString, err := token.SignedString([]byte(a.secret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func (a *Authenticator) ParseClaims(tokenStr string) (*UserClaims, error) {
	claims := &UserClaims{}
	t, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method %v", t.Header["alg"])
		}
		return []byte(a.secret), nil
	}, jwt.WithIssuer(a.issuer),
		jwt.WithExpirationRequired(),
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Name}))
	if err != nil || !t.Valid {
		return claims, err
	}
	return claims, nil
}
