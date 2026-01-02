package repository

import (
	"context"
	"lunar/internal/model"

	"github.com/google/uuid"
)

type ChatRepository interface {
	ListUserChats(ctx context.Context, userID uuid.UUID) ([]model.Chat, error)
	Create(ctx context.Context, chat model.Chat) (model.Chat, error)
	AddMember(ctx context.Context, chatID uuid.UUID, userID uuid.UUID) error
	ChatExists(ctx context.Context, id uuid.UUID) (bool, error)
}
