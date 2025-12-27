package auth

import (
	"lunar/internal/httputil"
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
				httputil.Unauthorized(w, "Invalid token")
				return
			}

			userID, err := uuid.Parse(claims.Subject)
			if err != nil {
				httputil.Unauthorized(w, "Invalid token payload")
				return
			}

			ctx := httputil.WithUser(r.Context(), &httputil.UserContext{
				ID:              userID,
				Email:           claims.Email,
				IsVerifiedEmail: claims.IsVerifiedEmail,
			})

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
				httputil.Unauthorized(w, "Invalid token")
				return
			}

			tokenStr := strings.TrimSpace(parts[1])
			claims, err := authenticator.ParseClaims(tokenStr)
			if err != nil {
				httputil.Unauthorized(w, "Invalid token")
				return
			}

			userID, err := uuid.Parse(claims.Subject)
			if err != nil {
				httputil.Unauthorized(w, "Invalid token payload")
				return
			}

			ctx := httputil.WithUser(r.Context(), &httputil.UserContext{
				ID:              userID,
				Email:           claims.Email,
				IsVerifiedEmail: claims.IsVerifiedEmail,
			})

			next.ServeHTTP(w, r.WithContext(ctx))
		}

		return http.HandlerFunc(fn)
	}
}
