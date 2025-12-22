package message

import (
	"lunar/internal/api/user"
	"time"

	"github.com/google/uuid"
)

type Message struct {
	ID        uuid.UUID `json:"id"`
	ChatID    uuid.UUID `json:"chatId"`
	Content   string    `json:"content"`
	Sender    user.User `json:"sender"`
	CreatedAt time.Time `json:"createdAt"`
}
