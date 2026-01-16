package room

import (
	"lunar/internal/httputil"
	"lunar/internal/ws"
	"net/http"
)

type Handler struct {
	validator *httputil.Validator
	service   *Service
	wsService *ws.Service
}

func NewHandler(validator *httputil.Validator, service *Service) *Handler {
	return &Handler{
		validator: validator,
		service:   service,
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

	room, err := h.service.JoinUserToRoom(r.Context(), user.ID, roomSlug)
	if err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	httputil.SuccessData(w, room)
}
