package repository

import (
	"context"
	"errors"
	"lunar/internal/model"

	"github.com/google/uuid"
)

var ErrRoomNotFound = errors.New("room not found")

type RoomRepository interface {
	ListUserRooms(ctx context.Context, userID uuid.UUID) ([]model.Room, error)
	Create(ctx context.Context, room model.Room) (model.Room, error)
	AddMember(ctx context.Context, roomID uuid.UUID, userID uuid.UUID) error
	RoomExists(ctx context.Context, id uuid.UUID) (bool, error)
	GetBySlug(ctx context.Context, slug string) (model.Room, error)
}
