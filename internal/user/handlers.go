package user

import (
	"errors"
	userapi "lunar/internal/api/user"
	"lunar/internal/authctx"
	"lunar/internal/httputil/json"
	"lunar/internal/httputil/validation"
	"net/http"
	"path/filepath"
	"strings"

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

func (h *Handler) CurrentUser(w http.ResponseWriter, r *http.Request) {
	user := authctx.UserFromContext(r.Context())

	json.Write(w, http.StatusOK, userapi.FromRepo(user))
}

func (h *Handler) UpdateEmail(w http.ResponseWriter, r *http.Request) {

	var req updateEmailRequest
	if err := json.Read(r, &req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if err := h.validate.Struct(req); err != nil {
		validation.WriteErrors(w, http.StatusBadRequest, validation.MapErrors(err))
		return
	}

	user := authctx.UserFromContext(r.Context())
	if req.Email == user.Email {
		validation.WriteErrors(w, http.StatusBadRequest, map[string]string{
			"email": "email is the same",
		})
		return
	}

	if err := h.service.UpdateEmail(r.Context(), user.ID, req.Email); err != nil {
		if errors.Is(err, ErrEmailAlreadyExists) {
			validation.WriteErrors(w, http.StatusConflict, map[string]string{
				"email": "email already exists",
			})
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	user := authctx.UserFromContext(r.Context())

	var req updatePasswordRequest
	if err := json.Read(r, &req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if err := h.validate.Struct(req); err != nil {
		validation.WriteErrors(w, http.StatusBadRequest, validation.MapErrors(err))
		return
	}

	if err := h.service.UpdatePassword(r.Context(), user.ID, req.CurrentPassword, req.NewPassword); err != nil {
		if errors.Is(err, ErrInvalidCurrentPassword) {
			validation.WriteErrors(w, http.StatusBadRequest, map[string]string{
				"currentPassword": err.Error(),
			})
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) UploadAvatar(w http.ResponseWriter, r *http.Request) {
	user := authctx.UserFromContext(r.Context())

	r.Body = http.MaxBytesReader(w, r.Body, 5<<20)
	if err := r.ParseMultipartForm(5 << 20); err != nil {
		json.WriteError(w, http.StatusBadRequest, "file too big")
		return
	}

	file, header, err := r.FormFile("avatar")
	if err != nil {
		json.WriteError(w, http.StatusBadRequest, "failed to get file")
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
		json.WriteError(w, http.StatusBadRequest, "unsupported file type")
		return
	}

	fileName, err := h.service.UploadAvatar(r.Context(), user.ID, file, header.Filename)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.Write(w, http.StatusOK, userapi.User{
		ID:            user.ID,
		Username:      user.Username,
		Email:         user.Email,
		AvatarURL:     fileName,
		EmailVerified: user.EmailVerified,
	})
}
