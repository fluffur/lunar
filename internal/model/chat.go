package model

import (
	"lunar/internal/util"
	"time"

	"github.com/google/uuid"
)

type Room struct {
	ID        uuid.UUID    `json:"id" binding:"required"`
	Name      string       `json:"name,omitempty"`
	Slug      string       `json:"slug" binding:"required"`
	Members   []RoomMember `json:"members,omitempty"`
	CreatedAt time.Time    `json:"-"`
}

func NewRoom(name string) (Room, error) {
	slug, err := util.GenerateRoomSlug()
	if err != nil {
		return Room{}, err
	}

	return Room{
		ID:        uuid.Must(uuid.NewV7()),
		Name:      name,
		Slug:      slug,
		CreatedAt: time.Now(),
	}, err
}

type RoomMember struct {
	ID       uuid.UUID `json:"id" binding:"required"`
	UserID   uuid.UUID `json:"userID" binding:"required"`
	RoomID   uuid.UUID `json:"roomID" binding:"required"`
	JoinedAt time.Time `json:"-"`
}

func NewRoomMember(userID uuid.UUID, roomID uuid.UUID) RoomMember {
	return RoomMember{
		ID:       uuid.Must(uuid.NewV7()),
		UserID:   userID,
		RoomID:   roomID,
		JoinedAt: time.Now(),
	}
}
