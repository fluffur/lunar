package postgres

import (
	"context"
	db "lunar/internal/db/postgres/sqlc"
	"lunar/internal/model"
	"lunar/internal/pagination"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type MessageRepository struct {
	queries *db.Queries
}

func NewMessageRepository(queries *db.Queries) *MessageRepository {
	return &MessageRepository{queries}
}

func mapMessage(message db.Message, sender model.User) model.Message {
	return model.Message{
		ID:        message.ID,
		ChatID:    message.ChatID,
		Content:   message.Content,
		Sender:    sender,
		CreatedAt: message.CreatedAt.Time,
	}
}

func mapMessages(rows []db.GetMessagesPagingRow) []model.Message {
	result := make([]model.Message, 0, len(rows))
	for _, r := range rows {
		result = append(result, model.Message{
			ID:        r.ID,
			ChatID:    r.ChatID,
			Content:   r.Content,
			CreatedAt: r.CreatedAt.Time,
			Sender: model.User{
				ID:            r.SenderID,
				Username:      r.Username,
				PasswordHash:  r.PasswordHash.String,
				Email:         r.Email,
				AvatarURL:     textOrEmpty(r.AvatarUrl),
				EmailVerified: r.EmailVerified,
			},
		})
	}
	return result
}

func (r *MessageRepository) CreateMessage(ctx context.Context, msg model.Message) (model.Message, error) {
	createdMessage, err := r.queries.CreateMessage(ctx, db.CreateMessageParams{
		ID:        msg.ID,
		ChatID:    msg.ChatID,
		SenderID:  msg.Sender.ID,
		Content:   msg.Content,
		CreatedAt: timestampFromTime(msg.CreatedAt),
	})
	if err != nil {
		return model.Message{}, err
	}

	return mapMessage(createdMessage, msg.Sender), err
}

func (r *MessageRepository) ListMessages(ctx context.Context, chatID uuid.UUID, limit int, cursor *pagination.Cursor) ([]model.Message, error) {
	params := db.GetMessagesPagingParams{
		ChatID: chatID,
		Limit:  int32(limit),
	}

	if cursor != nil {
		params.CursorID = cursor.ID
		params.CursorCreatedAt = pgtype.Timestamptz{
			Time:  cursor.CreatedAt,
			Valid: true,
		}
	}

	messages, err := r.queries.GetMessagesPaging(ctx, params)
	if err != nil {
		return nil, err
	}

	return mapMessages(messages), nil
}
