package auth

import (
	"context"
	"lunar/internal/authctx"
	"lunar/internal/user"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func WebSocketMiddleware(authenticator Authenticator, userService user.Service) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		fn := func(w http.ResponseWriter, r *http.Request) {
			tokenStr := r.URL.Query().Get("token")
			token, err := authenticator.ValidateToken(tokenStr)
			if err != nil {
				http.Error(w, "invalid access token", http.StatusUnauthorized)
				return
			}
			claims := token.Claims.(jwt.MapClaims)

			sub, ok := claims["sub"].(string)
			if !ok {
				http.Error(w, "invalid access token", http.StatusUnauthorized)
				return
			}

			userID, err := uuid.Parse(sub)
			if err != nil {
				http.Error(w, "invalid access token", http.StatusUnauthorized)
				return
			}

			user, err := userService.GetUser(r.Context(), userID)
			if err != nil {
				http.Error(w, "invalid access token", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), authctx.UserKey, user)

			next.ServeHTTP(w, r.WithContext(ctx))
		}
		return http.HandlerFunc(fn)
	}
}

func Middleware(authenticator Authenticator, userService user.Service) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		fn := func(w http.ResponseWriter, r *http.Request) {
			authorization := r.Header.Get("Authorization")

			parts := strings.Split(authorization, " ")

			if len(parts) < 2 || parts[0] != "Bearer" {

				http.Error(w, "invalid access token", http.StatusUnauthorized)
				return
			}

			token, err := authenticator.ValidateToken(strings.TrimSpace(parts[1]))
			if err != nil {

				http.Error(w, "invalid access token", http.StatusUnauthorized)
				return
			}

			claims := token.Claims.(jwt.MapClaims)

			sub, ok := claims["sub"].(string)
			if !ok {
				http.Error(w, "invalid access token", http.StatusUnauthorized)
				return
			}

			userID, err := uuid.Parse(sub)
			if err != nil {
				http.Error(w, "invalid access token", http.StatusUnauthorized)
				return
			}

			user, err := userService.GetUser(r.Context(), userID)
			if err != nil {
				http.Error(w, "invalid access token", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), authctx.UserKey, user)

			next.ServeHTTP(w, r.WithContext(ctx))
		}

		return http.HandlerFunc(fn)
	}
}
