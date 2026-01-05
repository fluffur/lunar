package auth

import (
	"lunar/internal/httputil"
	"net/http"
	"strings"

	"github.com/google/uuid"
)

func WebSocketMiddleware(authenticator *Authenticator) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tokenStr := r.URL.Query().Get("token")
			if tokenStr == "" {
				httputil.Unauthorized(w, "Invalid token")
				return
			}

			req, ok := authenticate(w, r, authenticator, tokenStr)
			if !ok {
				return
			}

			next.ServeHTTP(w, req)
		})
	}
}

func Middleware(authenticator *Authenticator) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authorization := r.Header.Get("Authorization")
			parts := strings.SplitN(authorization, " ", 2)

			if len(parts) < 2 || parts[0] != "Bearer" {
				httputil.Unauthorized(w, "Invalid token")
				return
			}

			req, ok := authenticate(w, r, authenticator, strings.TrimSpace(parts[1]))
			if !ok {
				return
			}

			next.ServeHTTP(w, req)
		})
	}
}

func authenticate(
	w http.ResponseWriter,
	r *http.Request,
	authenticator *Authenticator,
	tokenStr string,
) (*http.Request, bool) {

	claims, err := authenticator.ParseClaims(tokenStr)
	if err != nil {
		httputil.Unauthorized(w, "Invalid token")
		return nil, false
	}

	userID, err := uuid.Parse(claims.Subject)
	if err != nil {
		httputil.Unauthorized(w, "Invalid token payload")
		return nil, false
	}

	if !claims.IsVerifiedEmail {
		httputil.Unauthorized(w, ErrEmailNotVerified.Error())
		return nil, false
	}

	ctx := httputil.WithUser(r.Context(), &httputil.UserContext{
		ID:              userID,
		Email:           claims.Email,
		IsVerifiedEmail: claims.IsVerifiedEmail,
	})

	return r.WithContext(ctx), true
}
