package chat

import (
	"log/slog"
	"lunar/internal/chat/ws"
	ctxUtils "lunar/internal/utils/ctx"
	"lunar/internal/utils/json"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

type Handler struct {
	validate  *validator.Validate
	service   *Service
	wsService *ws.Service
}

func NewHandler(validate *validator.Validate, service *Service, wsService *ws.Service) *Handler {
	return &Handler{
		validate:  validate,
		service:   service,
		wsService: wsService,
	}
}

func (h *Handler) CreateChat(w http.ResponseWriter, r *http.Request) {
	var params createChatParams

	if err := json.Read(r, &params); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	chatID, err := h.service.CreateChat(r.Context(), params)
	if err != nil {
		slog.Error("create chat error", "err", err)
		json.InternalError(w, r, err)
		return
	}

	json.Write(w, http.StatusCreated, createChatResponse{ID: chatID})
}

func (h *Handler) JoinCurrentUser(w http.ResponseWriter, r *http.Request) {
	user := ctxUtils.UserFromRequest(r)
	chatID := uuid.MustParse(r.PathValue("chatID"))

	if err := h.service.JoinUserToChat(r.Context(), user.ID, chatID); err != nil {
		json.InternalError(w, r, err)
		return
	}

	json.Write(w, http.StatusOK, nil)
}
func (h *Handler) Websocket(w http.ResponseWriter, r *http.Request) {
	user := ctxUtils.UserFromRequest(r)
	chatID := uuid.MustParse(r.PathValue("chatID"))

	if err := h.service.JoinUserToChat(r.Context(), user.ID, chatID); err != nil {
		json.InternalError(w, r, err)
		return
	}

	if err := h.wsService.HandleWebSocket(w, r, chatID, user.ID); err != nil {
		slog.Error("websocket error", "err", err)
	}
}
