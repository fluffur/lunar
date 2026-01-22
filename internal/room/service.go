package room

import (
	"context"
	"fmt"
	"log"
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

func (s *Service) GetOrCreateRoom(ctx context.Context, userIDs []uuid.UUID) (model.Room, error) {
	if len(userIDs) == 0 {
		return model.Room{}, fmt.Errorf("at least one user ID required")
	}

	rooms, err := s.repo.ListUserRooms(ctx, userIDs[0])
	if err != nil {
		return model.Room{}, err
	}

	for _, room := range rooms {
		allPresent := true
		for _, userID := range userIDs {
			isMember, err := s.repo.IsUserRoomMember(ctx, room.ID, userID)
			if err != nil || !isMember {
				allPresent = false
				break
			}
		}
		if allPresent {
			log.Printf("Found existing room: slug=%s for users: %v", room.Slug, userIDs)
			return room, nil
		}
	}

	log.Printf("No existing room found, creating new one for users: %v", userIDs)
	room, err := model.NewRoom("")
	if err != nil {
		return model.Room{}, err
	}

	createdRoom, err := s.repo.Create(ctx, room)
	if err != nil {
		return model.Room{}, err
	}

	if err := s.repo.AddMembers(ctx, createdRoom.ID, userIDs); err != nil {
		return model.Room{}, err
	}

	log.Printf("Created new room: slug=%s for users: %v", createdRoom.Slug, userIDs)
	return createdRoom, nil
}
