package repository

import (
	"context"
	"lunar/internal/model"
	"lunar/internal/pagination"

	"github.com/google/uuid"
)

type MessageRepository interface {
	ListMessages(ctx context.Context, chatID uuid.UUID, limit int, cursor *pagination.Cursor) ([]model.Message, error)
	CreateMessage(ctx context.Context, msg model.Message) (model.Message, error)
}
