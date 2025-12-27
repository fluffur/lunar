package message

import (
	"errors"
	"lunar/internal/httputil"
	"net/http"

	"github.com/google/uuid"
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

func (h *Handler) ListMessages(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	chatID := uuid.MustParse(r.PathValue("chatID"))
	limit := h.service.NormalizeLimit(r.URL.Query().Get("limit"), 100, 32)

	var cursor *Cursor
	if cursorStr := r.URL.Query().Get("cursor"); cursorStr != "" {
		c, err := h.service.ParseCursor(cursorStr)
		if err != nil {
			httputil.BadRequest(w, "Invalid cursor")
			return
		}
		cursor = &c
	}

	messages, err := h.service.ListMessages(ctx, chatID, limit, cursor)
	if err != nil {
		if errors.Is(err, ErrChatNotFound) {
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

	httputil.Success(w, messagesResponse{
		Messages:   messages,
		NextCursor: nextCursor,
	})
}
