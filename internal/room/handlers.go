package room

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
//	@Summary	List user rooms
//	@Tags		room
//	@Security	BearerAuth
//	@Success	200	{object}	ListResponse
//	@Failure	401	{object}	httputil.ErrorResponse
//	@Failure	500	{object}	httputil.ErrorResponse
//	@Router		/rooms [get]
func (h *Handler) ListChats(w http.ResponseWriter, r *http.Request) {
	user := httputil.UserFromRequest(r)

	rooms, err := h.service.ListUserRooms(r.Context(), user.ID)
	if err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	httputil.SuccessData(w, ListResponse{Rooms: rooms})
}

// CreateChat godoc
//
//	@Summary	Create a new room
//	@Tags		room
//	@Accept		json
//	@Produce	json
//	@Security	BearerAuth
//	@Param		input	body		CreateRequest	true	"Chat creation params"
//	@Success	201		{object}	CreateResponse
//	@Failure	400		{object}	httputil.ErrorResponse
//	@Failure	401		{object}	httputil.ErrorResponse
//	@Failure	500		{object}	httputil.ErrorResponse
//	@Router		/rooms [post]
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
//	@Summary	Join current user to room
//	@Tags		room
//	@Param		roomID	path	string	true	"Room ID"
//	@Security	BearerAuth
//	@Success	200
//	@Failure	401	{object}	httputil.ErrorResponse
//	@Failure	500	{object}	httputil.ErrorResponse
//	@Router		/rooms/{roomID} [post]
func (h *Handler) JoinCurrentUser(w http.ResponseWriter, r *http.Request) {
	user := httputil.UserFromRequest(r)
	roomID := uuid.MustParse(r.PathValue("roomID"))

	if err := h.service.JoinUserToChat(r.Context(), user.ID, roomID); err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	httputil.Success(w)
}

// Websocket sockets
//
//	@Summary		Connect to the websocket in a room
//	@Tags			room
//	@Param			roomID	path	string	true	"Chat ID"
//	@Security		WebSocketQueryAuth
//	@Description	Connect to the websocket to receive real-time notifications in a room
//	@Schemes		ws
//	@Failure		401	{object}	httputil.ErrorResponse
//	@Failure		500	{object}	httputil.ErrorResponse
//	@Router			/rooms/{roomID}/ws [get]
func (h *Handler) Websocket(w http.ResponseWriter, r *http.Request) {
	user := httputil.UserFromRequest(r)
	roomID := uuid.MustParse(r.PathValue("roomID"))

	if err := h.service.JoinUserToChat(r.Context(), user.ID, roomID); err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	if err := h.wsService.HandleWebSocket(w, r, roomID, user.ID); err != nil {
		slog.Error("websocket error", "err", err)
	}
}
