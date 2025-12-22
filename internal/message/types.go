package message

import (
	"context"
	"lunar/internal/api/message"

	"github.com/google/uuid"
)

type Service interface {
	ListMessages(ctx context.Context, chatID uuid.UUID, limit int, cursor *Cursor) ([]message.Message, error)
	NormalizeLimit(limit string, max int, fallback int) int
	ParseCursor(cursorEncoded string) (Cursor, error)
	GenerateCursor(message message.Message) string
}

type messagesResponse struct {
	Messages   []message.Message `json:"messages"`
	NextCursor string            `json:"nextCursor"`
}
