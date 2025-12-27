package chat

import (
	"log/slog"
	"lunar/internal/httputil"
	"lunar/internal/ws"
	"net/http"

	"github.com/google/uuid"
)

type Handler struct {
	validator *httputil.Validator
	service   *Service
	wsService *ws.Service
}

func NewHandler(validator *httputil.Validator, service *Service, wsService *ws.Service) *Handler {
	return &Handler{
		validator: validator,
		service:   service,
		wsService: wsService,
	}
}

// CreateChat creates a new chat
//
//	@Summary		Create a new chat
//	@Tags			chat
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			input	body		createChatParams	true	"Chat creation params"
//	@SuccessData	201																																					{object}			CreateChatSuccessResponse
//	@Failure		400		{object}	httputil.ErrorResponse
//	@Failure		401		{object}	httputil.ErrorResponse
//	@Failure		500		{object}	httputil.ErrorResponse
//	@Router			/chat [post]
func (h *Handler) CreateChat(w http.ResponseWriter, r *http.Request) {
	var params createChatParams

	if err := httputil.Read(r, &params); err != nil {
		httputil.InvalidRequestBody(w)
		return
	}

	chatID, err := h.service.CreateChat(r.Context(), params)
	if err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	httputil.Created(w, createChatResponse{ID: chatID})
}

// JoinCurrentUser joins the current user to a chat
//
//	@Summary		Join current user to chat
//	@Tags			chat
//	@Param			chatID	path	string	true	"Chat ID"
//	@Security		BearerAuth
//	@SuccessData	200																{object}	httputil.Response
//	@Failure		401	{object}	httputil.ErrorResponse
//	@Failure		500	{object}	httputil.ErrorResponse
//	@Router			/chat/{chatID}/join [post]
func (h *Handler) JoinCurrentUser(w http.ResponseWriter, r *http.Request) {
	user := httputil.UserFromRequest(r)
	chatID := uuid.MustParse(r.PathValue("chatID"))

	if err := h.service.JoinUserToChat(r.Context(), user.ID, chatID); err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	httputil.Success(w)
}
func (h *Handler) Websocket(w http.ResponseWriter, r *http.Request) {
	user := httputil.UserFromRequest(r)
	chatID := uuid.MustParse(r.PathValue("chatID"))

	if err := h.service.JoinUserToChat(r.Context(), user.ID, chatID); err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	if err := h.wsService.HandleWebSocket(w, r, chatID, user.ID); err != nil {
		slog.Error("websocket error", "err", err)
	}
}
