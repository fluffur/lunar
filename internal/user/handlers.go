package user

import (
	"errors"
	userapi "lunar/internal/api/user"
	"lunar/internal/authctx"
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

func (h *Handler) CurrentUser(w http.ResponseWriter, r *http.Request) {
	userID := authctx.UserIDFromContext(r.Context())

	user, err := h.service.GetUser(r.Context(), userID)
	if err != nil {
		json.InternalError(w, r, err)
		return
	}

	json.Write(w, http.StatusOK, userapi.FromRepo(user))
}

func (h *Handler) UpdateEmail(w http.ResponseWriter, r *http.Request) {

	var req updateEmailRequest
	if err := json.Read(r, &req); err != nil {
		json.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		validation.WriteErrors(w, http.StatusBadRequest, validation.MapErrors(err))
		return
	}

	userID := authctx.UserIDFromContext(r.Context())

	user, err := h.service.GetUser(r.Context(), userID)
	if err != nil {
		json.InternalError(w, r, err)
		return
	}

	if req.Email == user.Email {
		validation.WriteError(w, http.StatusBadRequest, "email", "email is the same")
		return
	}

	if err := h.service.UpdateEmail(r.Context(), user.ID, req.Email); err != nil {
		if errors.Is(err, ErrEmailAlreadyExists) {
			validation.WriteError(w, http.StatusConflict, "email", "email already exists")
			return
		}
		json.InternalError(w, r, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	var req updatePasswordRequest
	if err := json.Read(r, &req); err != nil {
		json.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		validation.WriteErrors(w, http.StatusBadRequest, validation.MapErrors(err))
		return
	}

	userID := authctx.UserIDFromContext(r.Context())
	if err := h.service.UpdatePassword(r.Context(), userID, req.CurrentPassword, req.NewPassword); err != nil {
		if errors.Is(err, ErrInvalidCurrentPassword) {
			validation.WriteError(w, http.StatusBadRequest, "currentPassword", err.Error())
			return
		}
		json.InternalError(w, r, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) UploadAvatar(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 5<<20)
	if err := r.ParseMultipartForm(5 << 20); err != nil {
		validation.WriteError(w, http.StatusBadRequest, "avatar", "file too big")
		return
	}

	file, header, err := r.FormFile("avatar")
	if err != nil {
		validation.WriteError(w, http.StatusBadRequest, "avatar", "failed to read file")
		return
	}
	defer file.Close()

	filename, err := h.service.UploadAvatar(file, header.Filename)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidImage), errors.Is(err, ErrUploadAvatar):
			validation.WriteError(w, http.StatusBadRequest, "avatar", err.Error())
			return
		}

		json.InternalError(w, r, err)
		return
	}

	ctx := r.Context()
	if err := h.service.UpdateAvatar(ctx, authctx.UserIDFromContext(ctx), filename); err != nil {
		json.InternalError(w, r, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
