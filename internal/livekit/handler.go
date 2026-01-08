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

// Token godoc
//
//	@Summary	Get livekit access token
//	@Tags		livekit
//	@Produce	json
//	@Security	BearerAuth
//	@Param		roomSlug	path		string	true	"Room Slug"
//	@Success	200			{object}	TokenResponse
//	@Failure	400			{object}	httputil.ErrorResponse
//	@Failure	500			{object}	httputil.ErrorResponse
//	@Router		/livekit/token/{roomSlug} [get]
func (h *Handler) Token(w http.ResponseWriter, r *http.Request) {
	user := httputil.UserFromRequest(r)
	roomSlug := r.PathValue("roomSlug")

	token, err := h.service.GenerateToken(roomSlug, user.ID)
	if err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	httputil.SuccessData(w, TokenResponse{Token: token})
}
