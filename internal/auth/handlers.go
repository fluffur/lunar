package auth

import (
	"errors"
	"log/slog"
	"lunar/internal/httputil/json"
	"lunar/internal/httputil/validation"
	"net/http"

	"github.com/go-playground/validator/v10"
)

type Handler struct {
	validate *validator.Validate
	service  Service
}

func NewHandler(validate *validator.Validate, service Service) *Handler {
	return &Handler{
		validate: validate,
		service:  service,
	}
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var credentials registerCredentials
	if err := json.Read(r, &credentials); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if err := h.validate.Struct(credentials); err != nil {
		validation.WriteErrors(w, http.StatusBadRequest, validation.MapErrors(err))
		return
	}

	tokens, err := h.service.Register(r.Context(), credentials)
	if err != nil {
		if errors.Is(err, ErrUsernameExists) {
			validation.WriteErrors(w, http.StatusBadRequest, validation.FieldErrors{
				"username": err.Error(),
			})
			return
		}
		if errors.Is(err, ErrInvalidEmail) {
			validation.WriteErrors(w, http.StatusBadRequest, validation.FieldErrors{
				"email": err.Error(),
			})
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	h.setRefreshTokenCookie(w, tokens.RefreshToken)
	json.Write(w, http.StatusOK, tokens)
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var credentials loginCredentials
	if err := json.Read(r, &credentials); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if err := h.validate.Struct(credentials); err != nil {
		validation.WriteErrors(w, http.StatusBadRequest, validation.MapErrors(err))
		return
	}

	tokens, err := h.service.Login(r.Context(), credentials)
	if err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			json.WriteError(w, http.StatusUnauthorized, err.Error())
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	h.setRefreshTokenCookie(w, tokens.RefreshToken)
	json.Write(w, http.StatusOK, tokens)
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		http.Error(w, "no refresh token", http.StatusUnauthorized)
		return
	}

	tokens, err := h.service.Refresh(r.Context(), cookie.Value)
	if err != nil {
		http.Error(w, "invalid refresh token", http.StatusUnauthorized)
		return
	}

	h.setRefreshTokenCookie(w, tokens.RefreshToken)
	json.Write(w, http.StatusOK, tokens)
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		http.Error(w, "no refresh token", http.StatusUnauthorized)
		return
	}

	refreshToken := cookie.Value

	if err := h.service.Logout(r.Context(), refreshToken); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		slog.Error("failed to logout", "err", err)
		return
	}
	h.setRefreshTokenCookie(w, "")
	w.WriteHeader(http.StatusOK)
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
