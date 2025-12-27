package httputil

import (
	"encoding/json"
	"log/slog"
	"net/http"
)

type Response struct {
	Success bool `json:"success" default:"true"`
}

type DataResponse struct {
	Success bool `json:"success" default:"true"`
	Data    any  `json:"data,omitempty"`
}

type ErrorResponse struct {
	Success bool       `json:"success" default:"false"`
	Error   *ErrorBody `json:"error,omitempty"`
}

type ErrorBody struct {
	Code    string `json:"code,omitempty"`
	Message string `json:"message,omitempty"`
	Fields  any    `json:"fields,omitempty"`
}

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

func Success(w http.ResponseWriter, data any) {
	Write(w, http.StatusOK, DataResponse{
		Success: true,
		Data:    data,
	})
}

func Created(w http.ResponseWriter, data any) {
	Write(w, http.StatusCreated, DataResponse{
		Success: true,
		Data:    data,
	})
}

func NoContent(w http.ResponseWriter) {
	w.WriteHeader(http.StatusNoContent)
}

func Error(w http.ResponseWriter, status int, code, message string) {
	Write(w, status, ErrorResponse{
		Success: false,
		Error: &ErrorBody{
			Code:    code,
			Message: message,
		},
	})
}

type FieldErrors map[string]string

func ValidationError(w http.ResponseWriter, fields FieldErrors) {
	Write(w, http.StatusUnprocessableEntity, ErrorResponse{
		Success: false,
		Error: &ErrorBody{
			Code:   "validation_error",
			Fields: fields,
		},
	})
}

func BadRequest(w http.ResponseWriter, message string) {
	Error(w, http.StatusBadRequest, "bad_request", message)
}

func InvalidRequestBody(w http.ResponseWriter) {
	BadRequest(w, "Invalid request body")
}

func Unauthorized(w http.ResponseWriter, message string) {
	if message == "" {
		message = "Unauthorized"
	}
	Error(w, http.StatusUnauthorized, "unauthorized", message)
}

func Forbidden(w http.ResponseWriter, message string) {
	if message == "" {
		message = "Forbidden"
	}
	Error(w, http.StatusForbidden, "forbidden", message)
}

func NotFound(w http.ResponseWriter, message string) {
	if message == "" {
		message = "Resource not found"
	}
	Error(w, http.StatusNotFound, "not_found", message)
}

func Conflict(w http.ResponseWriter, message string) {
	if message == "" {
		message = "Resource conflict"
	}
	Error(w, http.StatusConflict, "conflict", message)
}

func InternalError(w http.ResponseWriter, r *http.Request, err error) {
	slog.ErrorContext(
		r.Context(),
		"internal_server_error",
		slog.Any("error", err),
		slog.String("method", r.Method),
		slog.String("path", r.URL.Path),
	)

	Write(w, http.StatusInternalServerError, ErrorResponse{
		Success: false,
		Error: &ErrorBody{
			Code:    "internal_error",
			Message: "Internal server error",
		},
	})
}
