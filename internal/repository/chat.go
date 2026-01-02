package repository

import (
	"context"
	"lunar/internal/model"

	"github.com/google/uuid"
)

type RoomRepository interface {
	ListUserChats(ctx context.Context, userID uuid.UUID) ([]model.Room, error)
	Create(ctx context.Context, room model.Room) (model.Room, error)
	AddMember(ctx context.Context, roomID uuid.UUID, userID uuid.UUID) error
	RoomExists(ctx context.Context, id uuid.UUID) (bool, error)
}
