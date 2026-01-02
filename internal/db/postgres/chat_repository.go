package postgres

import (
	"context"
	db "lunar/internal/db/postgres/sqlc"
	"lunar/internal/model"
	"lunar/internal/repository"

	"github.com/google/uuid"
)

type RoomRepository struct {
	queries db.Querier
}

func NewRoomRepository(queries db.Querier) repository.RoomRepository {
	return &RoomRepository{queries}
}

func mapRoom(room db.Room) model.Room {
	return model.Room{
		ID:   room.ID,
		Name: room.Name.String,
		Slug: room.Slug,
	}
}

func mapRooms(rooms []db.Room) []model.Room {
	result := make([]model.Room, len(rooms))
	for i, room := range rooms {
		result[i] = mapRoom(room)
	}
	return result
}

func (r *RoomRepository) ListUserChats(ctx context.Context, userID uuid.UUID) ([]model.Room, error) {
	rooms, err := r.queries.GetUserRooms(ctx, userID)
	if err != nil {
		return nil, err
	}
	return mapRooms(rooms), nil
}

func (r *RoomRepository) Create(ctx context.Context, room model.Room) (model.Room, error) {
	createdChat, err := r.queries.CreateRoom(ctx, db.CreateRoomParams{
		ID:        room.ID,
		Name:      textFromString(room.Name),
		Slug:      room.Slug,
		CreatedAt: timestampFromTime(room.CreatedAt),
	})
	if err != nil {
		return model.Room{}, err
	}
	return mapRoom(createdChat), nil

}

func (r *RoomRepository) RoomExists(ctx context.Context, id uuid.UUID) (bool, error) {
	return r.queries.RoomExists(ctx, id)
}

func (r *RoomRepository) AddMember(ctx context.Context, roomID uuid.UUID, userID uuid.UUID) error {
	member := model.NewRoomMember(roomID, userID)

	return r.queries.AddRoomMember(ctx, db.AddRoomMemberParams{
		ID:       member.ID,
		RoomID:   member.RoomID,
		UserID:   member.UserID,
		JoinedAt: timestampFromTime(member.JoinedAt),
	})
}
