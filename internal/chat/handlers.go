package chat

import (
	"log/slog"
	"lunar/internal/chat/ws"
	"lunar/internal/httputil"
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

func (h *Handler) JoinCurrentUser(w http.ResponseWriter, r *http.Request) {
	user := httputil.UserFromRequest(r)
	chatID := uuid.MustParse(r.PathValue("chatID"))

	if err := h.service.JoinUserToChat(r.Context(), user.ID, chatID); err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	httputil.Success(w, nil)
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
