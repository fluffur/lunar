package livekit

import (
	"lunar/internal/httputil"
	"lunar/internal/user"
	"net/http"
)

type Handler struct {
	service     *Service
	userService *user.Service
}

func NewHandler(service *Service, userService *user.Service) *Handler {
	return &Handler{
		service:     service,
		userService: userService,
	}
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
	userCtx := httputil.UserFromRequest(r)
	roomSlug := r.PathValue("roomSlug")

	user, err := h.userService.GetUser(r.Context(), userCtx.ID)
	if err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	token, err := h.service.GenerateToken(roomSlug, userCtx.ID, user.Username, user.AvatarURL)
	if err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	httputil.SuccessData(w, TokenResponse{Token: token})
}
