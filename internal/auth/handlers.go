package auth

import (
	"errors"
	"lunar/internal/httputil"
	"net/http"
)

type Handler struct {
	validator *httputil.Validator
	service   *Service
}

func NewHandler(validator *httputil.Validator, service *Service) *Handler {
	return &Handler{
		validator: validator,
		service:   service,
	}
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var credentials RegisterCredentials

	if err := httputil.Read(r, &credentials); err != nil {
		httputil.InvalidRequestBody(w)
		return
	}

	if fieldErrs := h.validator.Validate(credentials); fieldErrs != nil {
		httputil.ValidationError(w, fieldErrs)
		return
	}

	tokens, err := h.service.Register(r.Context(), credentials)
	if err != nil {
		if errors.Is(err, ErrUsernameExists) {
			httputil.ValidationError(w, map[string]string{"username": err.Error()})
			return
		}
		if errors.Is(err, ErrInvalidEmail) {
			httputil.ValidationError(w, map[string]string{"email": err.Error()})
			return
		}
		httputil.InternalError(w, r, err)
		return
	}

	h.setRefreshTokenCookie(w, tokens.RefreshToken)
	httputil.Success(w, tokens)
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var credentials LoginCredentials
	if err := httputil.Read(r, &credentials); err != nil {
		httputil.InvalidRequestBody(w)
		return
	}

	if fieldErrs := h.validator.Validate(credentials); fieldErrs != nil {
		httputil.ValidationError(w, fieldErrs)
		return
	}
	tokens, err := h.service.Login(r.Context(), credentials)
	if err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			httputil.Unauthorized(w, err.Error())
			return
		}
		httputil.InternalError(w, r, err)
		return
	}

	h.setRefreshTokenCookie(w, tokens.RefreshToken)

	httputil.Success(w, tokens)
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		httputil.Unauthorized(w, "no refresh token")
		return
	}

	tokens, err := h.service.Refresh(r.Context(), cookie.Value)
	if err != nil {
		httputil.Unauthorized(w, "invalid refresh token")
		return
	}

	h.setRefreshTokenCookie(w, tokens.RefreshToken)
	httputil.Success(w, tokens)
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		httputil.Unauthorized(w, "no refresh token")
		return
	}

	refreshToken := cookie.Value

	if err := h.service.Logout(r.Context(), refreshToken); err != nil {
		httputil.InternalError(w, r, err)
		return
	}
	h.setRefreshTokenCookie(w, "")

	httputil.Success(w, nil)
}

func (h *Handler) setRefreshTokenCookie(w http.ResponseWriter, refreshToken string) {
	cookie := &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/api/auth",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(w, cookie)
}
