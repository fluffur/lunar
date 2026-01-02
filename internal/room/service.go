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
	return s.repo.ListUserRooms(ctx, userID)
}

func (s *Service) CreateRoom(ctx context.Context, name string) (model.Room, error) {
	room, err := model.NewRoom(name)
	if err != nil {
		return model.Room{}, err
	}
	return s.repo.Create(ctx, room)
}

func (s *Service) JoinUserToRoom(ctx context.Context, userID uuid.UUID, roomSlug string) (model.Room, error) {
	room, err := s.repo.GetBySlug(ctx, roomSlug)
	if err != nil {
		return model.Room{}, err
	}

	return room, s.repo.AddMember(ctx, userID, room.ID)
}
