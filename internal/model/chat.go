package model

import (
	"lunar/internal/util"
	"time"

	"github.com/google/uuid"
)

type RoomType string

const (
	RoomTypeDM    RoomType = "dm"
	RoomTypeText  RoomType = "text"
	RoomTypeVoice RoomType = "voice"
)

type Room struct {
	ID        uuid.UUID        `json:"id" binding:"required"`
	Name      string           `json:"name,omitempty"`
	Slug      string           `json:"slug" binding:"required"`
	ServerID  *uuid.UUID       `json:"server_id,omitempty"`
	Type      RoomType         `json:"type" binding:"required"`
	Position  int              `json:"position"`
	Members   []RoomMemberInfo `json:"members,omitempty"`
	CreatedAt time.Time        `json:"-"`
}

type RoomMemberInfo struct {
	UserID    uuid.UUID `json:"user_id"`
	Username  string    `json:"username"`
	AvatarURL *string   `json:"avatar_url"`
}

func NewRoom(name string, roomType RoomType, serverID *uuid.UUID) (Room, error) {
	slug, err := util.GenerateRoomSlug()
	if err != nil {
		return Room{}, err
	}

	return Room{
		ID:        uuid.Must(uuid.NewV7()),
		Name:      name,
		Slug:      slug,
		Type:      roomType,
		ServerID:  serverID,
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

type Server struct {
	ID        uuid.UUID      `json:"id" binding:"required"`
	Name      string         `json:"name" binding:"required"`
	OwnerID   uuid.UUID      `json:"owner_id" binding:"required"`
	AvatarURL *string        `json:"avatar_url"`
	Members   []ServerMember `json:"members,omitempty"`
	Channels  []Room         `json:"channels,omitempty"`
	Roles     []ServerRole   `json:"roles,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
}

type ServerMember struct {
	ID       uuid.UUID   `json:"id"`
	ServerID uuid.UUID   `json:"server_id"`
	UserID   uuid.UUID   `json:"user_id"`
	Nickname *string     `json:"nickname"`
	JoinedAt time.Time   `json:"joined_at"`
	Roles    []uuid.UUID `json:"roles,omitempty"`
	User     *User       `json:"user,omitempty"`
}

type ServerRole struct {
	ID          uuid.UUID `json:"id"`
	ServerID    uuid.UUID `json:"server_id"`
	Name        string    `json:"name"`
	Color       *string   `json:"color"`
	Permissions int64     `json:"permissions"`
	Position    int       `json:"position"`
	CreatedAt   time.Time `json:"created_at"`
}
