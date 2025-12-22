package message

import (
	"errors"
	"lunar/internal/httputil/json"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

type Handler struct {
	validate *validator.Validate
	service  Service
}

func NewHandler(validate *validator.Validate, service Service) *Handler {
	return &Handler{
		validate: validate,
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
			json.WriteError(w, http.StatusBadRequest, "Invalid cursor")
			return
		}
		cursor = &c
	}

	messages, err := h.service.ListMessages(ctx, chatID, limit, cursor)
	if err != nil {
		switch {
		case errors.Is(err, ErrChatNotFound):
			json.WriteError(w, http.StatusBadRequest, "Chat not found")
		default:
			json.WriteError(w, http.StatusInternalServerError, "Internal server error")
		}
		return
	}

	var nextCursor string
	if len(messages) == limit {
		nextCursor = h.service.GenerateCursor(messages[len(messages)-1])
	}

	json.Write(w, http.StatusOK, messagesResponse{
		Messages:   messages,
		NextCursor: nextCursor,
	})
}
