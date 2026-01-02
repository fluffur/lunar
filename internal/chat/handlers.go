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

// ListChats godoc
//
//	@Summary	List user chats
//	@Tags		chat
//	@Security	BearerAuth
//	@Success	200	{object}	ListResponse
//	@Failure	401	{object}	httputil.ErrorResponse
//	@Failure	500	{object}	httputil.ErrorResponse
//	@Router		/chats [get]
func (h *Handler) ListChats(w http.ResponseWriter, r *http.Request) {
	user := httputil.UserFromRequest(r)

	chats, err := h.service.ListChats(r.Context(), user.ID)
	if err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	httputil.SuccessData(w, ListResponse{Chats: chats})
}

// CreateChat godoc
//
//	@Summary	Create a new chat
//	@Tags		chat
//	@Accept		json
//	@Produce	json
//	@Security	BearerAuth
//	@Param		input	body		CreateRequest	true	"Chat creation params"
//	@Success	201		{object}	CreateResponse
//	@Failure	400		{object}	httputil.ErrorResponse
//	@Failure	401		{object}	httputil.ErrorResponse
//	@Failure	500		{object}	httputil.ErrorResponse
//	@Router		/chats [post]
func (h *Handler) CreateChat(w http.ResponseWriter, r *http.Request) {
	var params CreateRequest

	if err := httputil.Read(r, &params); err != nil {
		httputil.InvalidRequestBody(w)
		return
	}

	createdChat, err := h.service.CreateChat(r.Context(), params.Name, params.Type)
	if err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	httputil.Created(w, CreateResponse{ID: createdChat.ID})
}

// JoinCurrentUser godoc
//
//	@Summary	Join current user to chat
//	@Tags		chat
//	@Param		chatID	path	string	true	"Chat ID"
//	@Security	BearerAuth
//	@Success	200
//	@Failure	401	{object}	httputil.ErrorResponse
//	@Failure	500	{object}	httputil.ErrorResponse
//	@Router		/chats/{chatID} [post]
func (h *Handler) JoinCurrentUser(w http.ResponseWriter, r *http.Request) {
	user := httputil.UserFromRequest(r)
	chatID := uuid.MustParse(r.PathValue("chatID"))

	if err := h.service.JoinUserToChat(r.Context(), user.ID, chatID); err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	httputil.Success(w)
}

// Websocket sockets
//
//	@Summary		Connect to the websocket in a chat
//	@Tags			chat
//	@Param			chatID	path	string	true	"Chat ID"
//	@Security		WebSocketQueryAuth
//	@Description	Connect to the websocket to receive real-time notifications in a chat
//	@Schemes		ws
//	@Failure		401	{object}	httputil.ErrorResponse
//	@Failure		500	{object}	httputil.ErrorResponse
//	@Router			/chats/{chatID}/ws [get]
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
