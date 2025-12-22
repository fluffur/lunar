package message

import (
	repo "lunar/internal/adapters/postgresql/sqlc"
	"lunar/internal/api/user"

	"github.com/jackc/pgx/v5/pgtype"
)

func FromRepo(
	msg repo.Message,
	sender repo.User,
) Message {
	return Message{
		ID:        msg.ID,
		ChatID:    msg.ChatID,
		Content:   msg.Content,
		CreatedAt: msg.CreatedAt.Time,
		Sender:    user.FromRepo(sender),
	}
}

func MessagesFromRepo(rows []repo.GetMessagesPagingRow) []Message {
	result := make([]Message, 0, len(rows))
	for _, r := range rows {
		result = append(result, Message{
			ID:        r.ID,
			ChatID:    r.ChatID,
			Content:   r.Content,
			CreatedAt: r.CreatedAt.Time,
			Sender: user.User{
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

func textOrEmpty(t pgtype.Text) string {
	if t.Valid {
		return t.String
	}
	return ""
}
