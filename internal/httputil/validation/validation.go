package validation

import (
	"errors"
	"lunar/internal/httputil/json"
	"net/http"

	"github.com/go-playground/validator/v10"
)

type FieldErrors map[string]string

func MapErrors(err error) FieldErrors {
	feMap := FieldErrors{}

	var ve validator.ValidationErrors
	ok := errors.As(err, &ve)
	if !ok {
		return feMap
	}

	for _, fe := range ve {
		feMap[fe.Field()] = fieldErrorMessage(fe)
	}

	return feMap
}

func WriteErrors(w http.ResponseWriter, status int, errors FieldErrors) {
	json.Write(w, status, map[string]FieldErrors{
		"errors": errors,
	})
}

func WriteError(w http.ResponseWriter, status int, field, message string) {
	json.Write(w, status, map[string]FieldErrors{
		"errors": {field: message},
	})
}

func fieldErrorMessage(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return "Required"
	case "email":
		return "Invalid email"
	case "min":
		return "Min length is " + fe.Param()
	default:
		return "Invalid value"
	}
}
