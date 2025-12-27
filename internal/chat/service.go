package chat

import (
	"context"
	db "lunar/internal/db/sqlc"

	"github.com/google/uuid"
)

type Service struct {
	queries db.Querier
}

func NewService(q db.Querier) *Service {
	return &Service{
		queries: q,
	}
}

func (s *Service) GetChat(ctx context.Context, id uuid.UUID) (db.Chat, error) {
	return s.queries.GetChat(ctx, id)
}

func (s *Service) CreateChat(ctx context.Context, params createChatParams) (uuid.UUID, error) {
	return s.queries.CreateChat(ctx, db.CreateChatParams{
		Type: params.Type,
	})
}

func (s *Service) JoinUserToChat(ctx context.Context, userID uuid.UUID, chatID uuid.UUID) error {
	return s.queries.AddUserToChat(ctx, db.AddUserToChatParams{
		UserID: userID,
		ChatID: chatID,
	})
}
