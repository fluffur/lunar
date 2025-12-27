package user

import (
	"errors"
	"lunar/internal/httputil"
	userModel "lunar/internal/model"
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

func (h *Handler) CurrentUser(w http.ResponseWriter, r *http.Request) {
	userCtx := httputil.UserFromRequest(r)

	user, err := h.service.GetUser(r.Context(), userCtx.ID)
	if err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	httputil.Success(w, userModel.UserFromRepo(user))
}

func (h *Handler) UpdateEmail(w http.ResponseWriter, r *http.Request) {
	var req updateEmailRequest
	if err := httputil.Read(r, &req); err != nil {
		httputil.InvalidRequestBody(w)
		return
	}

	if err := h.validator.Validate(req); err != nil {
		httputil.ValidationError(w, err)
		return
	}

	userCtx := httputil.UserFromRequest(r)

	user, err := h.service.GetUser(r.Context(), userCtx.ID)
	if err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	if req.Email == user.Email {
		httputil.ValidationError(w, map[string]string{"email": "email is the same"})
		return
	}

	if err := h.service.UpdateEmail(r.Context(), user.ID, req.Email); err != nil {
		if errors.Is(err, ErrEmailAlreadyExists) {
			httputil.ValidationError(w, map[string]string{"email": "email already exists"})
			return
		}
		httputil.InternalError(w, r, err)
		return
	}

	httputil.Success(w, nil)
}

func (h *Handler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	var req updatePasswordRequest
	if err := httputil.Read(r, &req); err != nil {
		httputil.InvalidRequestBody(w)
		return
	}

	if fieldErrs := h.validator.Validate(req); fieldErrs != nil {
		httputil.ValidationError(w, fieldErrs)
		return
	}

	userCtx := httputil.UserFromRequest(r)
	if err := h.service.UpdatePassword(r.Context(), userCtx.ID, req.CurrentPassword, req.NewPassword); err != nil {
		if errors.Is(err, ErrInvalidCurrentPassword) {
			httputil.ValidationError(w, map[string]string{"currentPassword": err.Error()})
			return
		}
		httputil.InternalError(w, r, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) UploadAvatar(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 5<<20)
	if err := r.ParseMultipartForm(5 << 20); err != nil {
		httputil.ValidationError(w, httputil.FieldErrors{"avatar": "file too big"})
		return
	}

	file, _, err := r.FormFile("avatar")
	if err != nil {
		httputil.ValidationError(w, httputil.FieldErrors{"avatar": "failed to read file"})
		return
	}
	defer file.Close()

	filename, err := h.service.UploadAvatar(file)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidImage), errors.Is(err, ErrUploadAvatar):
			httputil.ValidationError(w, httputil.FieldErrors{"avatar": err.Error()})
			return
		}

		httputil.InternalError(w, r, err)
		return
	}

	ctx := r.Context()
	if err := h.service.UpdateAvatar(ctx, httputil.UserFromRequest(r).ID, filename); err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) SendVerificationCode(w http.ResponseWriter, r *http.Request) {
	var req sendVerificationCodeRequest
	if err := httputil.Read(r, &req); err != nil {
		httputil.InvalidRequestBody(w)
		return
	}

	if fieldErrs := h.validator.Validate(req); fieldErrs != nil {
		httputil.ValidationError(w, fieldErrs)
		return
	}

	userCtx := httputil.UserFromRequest(r)

	if err := h.service.SendVerificationCode(r.Context(), userCtx.ID); err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) VerifyEmail(w http.ResponseWriter, r *http.Request) {

}
