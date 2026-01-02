package message

import (
	"errors"
	"lunar/internal/httputil"
	"lunar/internal/pagination"
	"net/http"
)

type Handler struct {
	validate *httputil.Validator
	service  *Service
}

func NewHandler(validator *httputil.Validator, service *Service) *Handler {
	return &Handler{
		validate: validator,
		service:  service,
	}
}

// ListMessages lists messages in a room
//
//	@Summary	List messages in a room
//	@Tags		message
//	@Produce	json
//	@Security	BearerAuth
//	@Param		roomSlug	path		string	true	"Room Slug"
//	@Param		limit		query		int		false	"Limit"
//	@Param		cursor		query		string	false	"Cursor"
//	@Success	200			{object}	GetPagingResponse
//	@Failure	400			{object}	httputil.ErrorResponse
//	@Failure	500			{object}	httputil.ErrorResponse
//	@Router		/rooms/{roomSlug}/messages [get]
func (h *Handler) ListMessages(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	roomSlug := r.PathValue("roomSlug")
	limit := normalizeLimit(r.URL.Query().Get("limit"), 100, 32)

	var cursor *pagination.Cursor
	if cursorStr := r.URL.Query().Get("cursor"); cursorStr != "" {
		c, err := h.service.ParseCursor(cursorStr)
		if err != nil {
			httputil.BadRequest(w, "Invalid cursor")
			return
		}
		cursor = &c
	}

	messages, err := h.service.ListMessages(ctx, roomSlug, limit, cursor)
	if err != nil {
		if errors.Is(err, ErrRoomNotFound) {
			httputil.BadRequest(w, "Chat not found")
			return
		}
		httputil.InternalError(w, r, err)
		return
	}

	var nextCursor string
	if len(messages) == limit {
		nextCursor = h.service.GenerateCursor(messages[len(messages)-1])
	}

	httputil.SuccessData(w, GetPagingResponse{
		Messages:   messages,
		NextCursor: nextCursor,
	})
}
