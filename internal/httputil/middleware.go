package httputil

import (
	"log/slog"
	"net/http"
	"runtime/debug"
)

func Recovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				slog.ErrorContext(
					r.Context(),
					"panic_recovered",
					slog.Any("panic", err),
					slog.String("method", r.Method),
					slog.String("path", r.URL.Path),
					slog.String("stack", string(debug.Stack())),
				)

				Write(w, http.StatusInternalServerError, Response{
					Success: false,
					Error: &ErrorBody{
						Code:    "internal_error",
						Message: "Internal server error",
					},
				})
			}
		}()

		next.ServeHTTP(w, r)
	})
}
