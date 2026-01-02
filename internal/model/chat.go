package model

import (
	"time"

	"github.com/google/uuid"
)

type Chat struct {
	ID        uuid.UUID    `json:"id" binding:"required"`
	Name      string       `json:"name,omitempty"`
	Type      string       `json:"type" binding:"required"`
	Members   []ChatMember `json:"members,omitempty"`
	CreatedAt time.Time    `json:"-"`
}

func NewChat(name, type_ string) Chat {
	return Chat{
		ID:        uuid.Must(uuid.NewV7()),
		Name:      name,
		Type:      type_,
		CreatedAt: time.Now(),
	}
}

type ChatMember struct {
	ID       uuid.UUID `json:"id" binding:"required"`
	UserID   uuid.UUID `json:"userID" binding:"required"`
	ChatID   uuid.UUID `json:"chatID" binding:"required"`
	JoinedAt time.Time `json:"-"`
}

func NewChatMember(userID uuid.UUID, chatID uuid.UUID) ChatMember {
	return ChatMember{
		ID:       uuid.Must(uuid.NewV7()),
		UserID:   userID,
		ChatID:   chatID,
		JoinedAt: time.Now(),
	}
}
