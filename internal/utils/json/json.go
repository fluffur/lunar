package json

import (
	"encoding/json"
	"log/slog"
	"net/http"
)

func Write(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func Read(r *http.Request, data any) error {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	return decoder.Decode(data)
}

func WriteError(w http.ResponseWriter, status int, message string) {
	Write(w, status, map[string]string{
		"error": message,
	})
}

func InternalError(w http.ResponseWriter, r *http.Request, err error) {
	slog.ErrorContext(
		r.Context(),
		"internal_server_error",
		slog.Any("error", err),
		slog.String("method", r.Method),
		slog.String("path", r.URL.Path),
	)

	w.WriteHeader(http.StatusInternalServerError)
}
