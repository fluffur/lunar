package chat

import (
	"context"
	"lunar/internal/adapters/postgresql/sqlc"

	"github.com/google/uuid"
)

type Service struct {
	q sqlc.Querier
}

func NewService(q sqlc.Querier) *Service {
	return &Service{
		q: q,
	}
}

func (s *Service) GetChat(ctx context.Context, id uuid.UUID) (sqlc.Chat, error) {
	return s.q.GetChat(ctx, id)
}

func (s *Service) CreateChat(ctx context.Context, params createChatParams) (uuid.UUID, error) {
	return s.q.CreateChat(ctx, sqlc.CreateChatParams{
		Type: params.Type,
	})
}

func (s *Service) JoinUserToChat(ctx context.Context, userID uuid.UUID, chatID uuid.UUID) error {
	return s.q.AddUserToChat(ctx, sqlc.AddUserToChatParams{
		UserID: userID,
		ChatID: chatID,
	})
}
