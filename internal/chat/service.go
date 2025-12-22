package chat

import (
	"context"
	repo "lunar/internal/adapters/postgresql/sqlc"

	"github.com/google/uuid"
)

type svc struct {
	repo repo.Querier
}

func NewService(repo repo.Querier) Service {
	return &svc{
		repo: repo,
	}
}

func (s *svc) GetChat(ctx context.Context, id uuid.UUID) (repo.Chat, error) {
	return s.repo.GetChat(ctx, id)
}

func (s *svc) CreateChat(ctx context.Context, params createChatParams) (uuid.UUID, error) {
	return s.repo.CreateChat(ctx, repo.CreateChatParams{
		Type: params.Type,
	})
}

func (s *svc) JoinUserToChat(ctx context.Context, userID uuid.UUID, chatID uuid.UUID) error {
	return s.repo.AddUserToChat(ctx, repo.AddUserToChatParams{
		UserID: userID,
		ChatID: chatID,
	})
}
