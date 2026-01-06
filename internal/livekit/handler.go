package livekit

import (
	"lunar/internal/httputil"
	"net/http"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service}
}

func (h *Handler) Token(w http.ResponseWriter, r *http.Request) {
	user := httputil.UserFromRequest(r)
	roomSlug := r.PathValue("roomSlug")

	token, err := h.service.GenerateToken(roomSlug, user.ID)
	if err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	httputil.SuccessData(w, token)
}
