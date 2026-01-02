package chat

import (
	"context"
	"lunar/internal/model"
	"lunar/internal/repository"

	"github.com/google/uuid"
)

type Service struct {
	repo repository.ChatRepository
}

func NewService(repo repository.ChatRepository) *Service {
	return &Service{repo}
}

func (s *Service) ListChats(ctx context.Context, userID uuid.UUID) ([]model.Chat, error) {
	return s.repo.ListUserChats(ctx, userID)
}

func (s *Service) CreateChat(ctx context.Context, chatName, chatType string) (model.Chat, error) {
	return s.repo.Create(ctx, model.NewChat(chatName, chatType))
}

func (s *Service) JoinUserToChat(ctx context.Context, userID uuid.UUID, chatID uuid.UUID) error {
	return s.repo.AddMember(ctx, userID, chatID)
}
