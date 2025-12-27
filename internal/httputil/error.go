package httputil

import (
	"encoding/json"
	"net/http"
)

type Response struct {
	Success bool      `json:"success"`
	Data    any       `json:"data,omitempty"`
	Error   ErrorBody `json:"error,omitempty"`
}

type ErrorBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Fields  any    `json:"fields,omitempty"`
}

func Success(data any) Response {
	return Response{
		Success: true,
		Data:    data,
	}
}

func Error(code, message string) Response {
	return Response{
		Success: false,
		Error: ErrorBody{
			Code:    code,
			Message: message,
		},
	}
}

func ValidationError(fields any) Response {
	return Response{
		Success: false,
		Error: ErrorBody{
			Code:   "validation_error",
			Fields: fields,
		},
	}
}

func Unauthorized(message string) Response {
	return Response{
		Success: false,
		Error: ErrorBody{
			Code:    "unauthorized",
			Message: message,
		},
	}
}

func WriteJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func WriteUnauthorized(w http.ResponseWriter, message string) {
	WriteJSON(w, http.StatusUnauthorized, Unauthorized(message))
}
