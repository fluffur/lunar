package model

import (
	db "lunar/internal/db/sqlc"
	"time"

	"github.com/google/uuid"
)

type Message struct {
	ID        uuid.UUID `json:"id"`
	ChatID    uuid.UUID `json:"chatId"`
	Content   string    `json:"content"`
	Sender    User      `json:"sender"`
	CreatedAt time.Time `json:"createdAt"`
}

func MessageFromRepo(
	msg db.Message,
	sender db.User,
) Message {
	return Message{
		ID:        msg.ID,
		ChatID:    msg.ChatID,
		Content:   msg.Content,
		CreatedAt: msg.CreatedAt.Time,
		Sender:    UserFromRepo(sender),
	}
}

func MessagesFromRepo(rows []db.GetMessagesPagingRow) []Message {
	result := make([]Message, 0, len(rows))
	for _, r := range rows {
		result = append(result, Message{
			ID:        r.ID,
			ChatID:    r.ChatID,
			Content:   r.Content,
			CreatedAt: r.CreatedAt.Time,
			Sender: User{
				ID:            r.SenderID,
				Username:      r.Username,
				Email:         r.Email,
				AvatarURL:     textOrEmpty(r.AvatarUrl),
				EmailVerified: r.EmailVerified,
			},
		})
	}
	return result
}
