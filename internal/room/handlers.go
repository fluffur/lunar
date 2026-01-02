package room

import (
	"log/slog"
	"lunar/internal/httputil"
	"lunar/internal/ws"
	"net/http"
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

// ListRooms godoc
//
//	@Summary	List user rooms
//	@Tags		room
//	@Security	BearerAuth
//	@Success	200	{object}	ListResponse
//	@Failure	401	{object}	httputil.ErrorResponse
//	@Failure	500	{object}	httputil.ErrorResponse
//	@Router		/rooms [get]
func (h *Handler) ListRooms(w http.ResponseWriter, r *http.Request) {
	user := httputil.UserFromRequest(r)

	rooms, err := h.service.ListUserRooms(r.Context(), user.ID)
	if err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	httputil.SuccessData(w, ListResponse{Rooms: rooms})
}

// CreateRoom godoc
//
//	@Summary	Create a new room
//	@Tags		room
//	@Accept		json
//	@Produce	json
//	@Security	BearerAuth
//	@Param		input	body		CreateRequest	true	"Room creation params"
//	@Success	201		{object}	CreateResponse
//	@Failure	400		{object}	httputil.ErrorResponse
//	@Failure	401		{object}	httputil.ErrorResponse
//	@Failure	500		{object}	httputil.ErrorResponse
//	@Router		/rooms [post]
func (h *Handler) CreateRoom(w http.ResponseWriter, r *http.Request) {
	var params CreateRequest

	if err := httputil.Read(r, &params); err != nil {
		httputil.InvalidRequestBody(w)
		return
	}

	created, err := h.service.CreateRoom(r.Context(), params.Name)
	if err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	httputil.Created(w, CreateResponse{Slug: created.Slug})
}

// JoinCurrentUser godoc
//
//	@Summary	Join current user to room
//	@Tags		room
//	@Param		roomSlug	path	string	true	"Room Slug"
//	@Security	BearerAuth
//	@Success	200
//	@Failure	401	{object}	httputil.ErrorResponse
//	@Failure	500	{object}	httputil.ErrorResponse
//	@Router		/rooms/{roomSlug} [post]
func (h *Handler) JoinCurrentUser(w http.ResponseWriter, r *http.Request) {
	user := httputil.UserFromRequest(r)
	roomSlug := r.PathValue("roomSlug")

	if _, err := h.service.JoinUserToRoom(r.Context(), user.ID, roomSlug); err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	httputil.Success(w)
}

// Websocket sockets
//
//	@Summary		Connect to the websocket in a room
//	@Tags			room
//	@Param			roomSlug	path	string	true	"Room Slug"
//	@Security		WebSocketQueryAuth
//	@Description	Connect to the websocket to receive real-time notifications in a room
//	@Schemes		ws
//	@Failure		401	{object}	httputil.ErrorResponse
//	@Failure		500	{object}	httputil.ErrorResponse
//	@Router			/rooms/{roomSlug}/ws [get]
func (h *Handler) Websocket(w http.ResponseWriter, r *http.Request) {
	user := httputil.UserFromRequest(r)
	roomSlug := r.PathValue("roomSlug")

	room, err := h.service.JoinUserToRoom(r.Context(), user.ID, roomSlug)
	if err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	if err := h.wsService.HandleWebSocket(w, r, room, user.ID); err != nil {
		slog.Error("websocket error", "err", err)
	}
}
