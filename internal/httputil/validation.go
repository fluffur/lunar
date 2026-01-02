package httputil

import (
	"errors"
	"fmt"
	"reflect"
	"regexp"
	"strings"

	"github.com/go-playground/validator/v10"
)

type Validator struct {
	validate *validator.Validate
}

var alphaNumSpace = regexp.MustCompile(`^[a-zA-Z0-9 _-]+$`)

func alphaNumSpaceValidator(fl validator.FieldLevel) bool {
	return alphaNumSpace.MatchString(fl.Field().String())
}

func NewValidator() *Validator {
	validate := validator.New()
	validate.RegisterValidation("alphanumspace", alphaNumSpaceValidator)
	validate.RegisterTagNameFunc(func(fld reflect.StructField) string {
		name := strings.SplitN(fld.Tag.Get("json"), ",", 2)[0]

		if name == "-" {
			return ""
		}

		return name
	})

	return &Validator{
		validate: validate,
	}
}

func (v *Validator) Validate(s any) FieldErrors {
	err := v.validate.Struct(s)
	if err == nil {
		return nil
	}
	var ve validator.ValidationErrors
	if !errors.As(err, &ve) {
		return nil
	}

	return mapValidationErrors(ve)
}

func (v *Validator) ValidateVar(field interface{}, tag string) error {
	return v.validate.Var(field, tag)
}

func mapValidationErrors(ve validator.ValidationErrors) FieldErrors {
	errs := make(FieldErrors, len(ve))

	for _, fe := range ve {
		errs[fe.Field()] = formatValidationError(fe)
	}

	return errs
}

func formatValidationError(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return "This field is required"
	case "email":
		return "Invalid email format"
	case "min":
		switch fe.Type().Kind() {
		case 2, 3, 4, 5, 6: // int types
			return fmt.Sprintf("Must be at least %s", fe.Param())
		default:
			return fmt.Sprintf("Must be at least %s characters", fe.Param())
		}
	case "max":
		switch fe.Type().Kind() {
		case 2, 3, 4, 5, 6: // int types
			return fmt.Sprintf("Must be at most %s", fe.Param())
		default:
			return fmt.Sprintf("Must be at most %s characters", fe.Param())
		}
	case "len":
		return fmt.Sprintf("Must be exactly %s characters", fe.Param())
	case "eqfield":
		return fmt.Sprintf("Must match %s", fe.Param())
	case "alphanum":
		return "Must contain only letters and numbers"
	case "alpha":
		return "Must contain only letters"
	case "numeric":
		return "Must be a valid number"
	case "url":
		return "Must be a valid URL"
	case "uuid":
		return "Must be a valid UUID"
	case "oneof":
		return fmt.Sprintf("Must be one of: %s", fe.Param())
	case "gt":
		return fmt.Sprintf("Must be greater than %s", fe.Param())
	case "gte":
		return fmt.Sprintf("Must be at least %s", fe.Param())
	case "lt":
		return fmt.Sprintf("Must be less than %s", fe.Param())
	case "lte":
		return fmt.Sprintf("Must be at most %s", fe.Param())
	default:
		return "Invalid value"
	}
}
