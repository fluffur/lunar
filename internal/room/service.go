package room

import (
	"context"
	"lunar/internal/model"
	"lunar/internal/repository"

	"github.com/google/uuid"
)

type Service struct {
	repo repository.RoomRepository
}

func NewService(repo repository.RoomRepository) *Service {
	return &Service{repo}
}

func (s *Service) ListUserRooms(ctx context.Context, userID uuid.UUID) ([]model.Room, error) {
	return s.repo.ListUserChats(ctx, userID)
}

func (s *Service) CreateChat(ctx context.Context, name, slug string) (model.Room, error) {
	return s.repo.Create(ctx, model.NewRoom(name, slug))
}

func (s *Service) JoinUserToChat(ctx context.Context, userID uuid.UUID, roomID uuid.UUID) error {
	return s.repo.AddMember(ctx, userID, roomID)
}
