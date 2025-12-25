package auth

import (
	"context"
	ctxUtils "lunar/internal/utils/ctx"
	"net/http"
	"strings"

	"github.com/google/uuid"
)

func WebSocketMiddleware(authenticator *Authenticator) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		fn := func(w http.ResponseWriter, r *http.Request) {
			tokenStr := r.URL.Query().Get("token")
			claims, err := authenticator.ParseClaims(tokenStr)
			if err != nil {
				w.WriteHeader(http.StatusUnauthorized)
				return
			}

			userID, err := uuid.Parse(claims.Subject)
			if err != nil {
				w.WriteHeader(http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), ctxUtils.UserCtxKey, userID)

			next.ServeHTTP(w, r.WithContext(ctx))
		}
		return http.HandlerFunc(fn)
	}
}

func Middleware(authenticator *Authenticator) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		fn := func(w http.ResponseWriter, r *http.Request) {
			authorization := r.Header.Get("Authorization")
			parts := strings.SplitN(authorization, " ", 2)

			if len(parts) < 2 || parts[0] != "Bearer" {
				w.WriteHeader(http.StatusUnauthorized)
				return
			}

			tokenStr := strings.TrimSpace(parts[1])
			claims, err := authenticator.ParseClaims(tokenStr)
			if err != nil {
				w.WriteHeader(http.StatusUnauthorized)
				return
			}

			userID, err := uuid.Parse(claims.Subject)
			if err != nil {
				w.WriteHeader(http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), ctxUtils.UserCtxKey, userID)

			next.ServeHTTP(w, r.WithContext(ctx))
		}

		return http.HandlerFunc(fn)
	}
}
