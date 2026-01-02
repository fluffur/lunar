package model

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Message struct {
	ID        uuid.UUID `json:"id" binding:"required"`
	ChatID    uuid.UUID `json:"chatId" binding:"required"`
	Content   string    `json:"content" binding:"required"`
	Sender    User      `json:"sender" binding:"required"`
	CreatedAt time.Time `json:"createdAt" binding:"required"`
}

func NewMessage(chatID uuid.UUID, content string, sender User) (Message, error) {
	if len(content) > 5000 {
		return Message{}, fmt.Errorf("invalid content length")
	}
	return Message{
		ID:        uuid.Must(uuid.NewV7()),
		ChatID:    chatID,
		Content:   content,
		Sender:    sender,
		CreatedAt: time.Now(),
	}, nil
}
