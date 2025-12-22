package user

import (
	userapi "lunar/internal/api/user"
	"lunar/internal/authctx"
	"lunar/internal/httputil/json"
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
