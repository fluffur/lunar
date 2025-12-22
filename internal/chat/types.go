package chat

import (
	"context"
	repo "lunar/internal/adapters/postgresql/sqlc"

	"github.com/google/uuid"
)

type Service interface {
	GetChat(ctx context.Context, id uuid.UUID) (repo.Chat, error)
	CreateChat(ctx context.Context, params createChatParams) (uuid.UUID, error)
	JoinUserToChat(ctx context.Context, userID uuid.UUID, chatID uuid.UUID) error
}

type createChatParams struct {
	Name string `json:"name" omitempty:""`
	Type string `json:"type"`
}

type createChatResponse struct {
	ID uuid.UUID `json:"id"`
}
