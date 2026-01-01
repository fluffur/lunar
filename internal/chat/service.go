package chat

import (
	"context"
	db2 "lunar/internal/db/postgres/sqlc"
	"lunar/internal/model"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type Service struct {
	queries db2.Querier
}

func NewService(q db2.Querier) *Service {
	return &Service{
		queries: q,
	}
}

func mapChats(chats []db2.Chat) []model.Chat {
	c := make([]model.Chat, len(chats))
	for i, chat := range chats {
		c[i] = model.Chat{
			ID:   chat.ID,
			Name: chat.Name.String,
			Type: chat.Type,
		}
	}
	return c
}

func (s *Service) ListChats(ctx context.Context, userID uuid.UUID) ([]model.Chat, error) {
	chats, err := s.queries.GetUserChats(ctx, userID)
	if err != nil {
		return nil, err
	}

	return mapChats(chats), nil
}

func (s *Service) CreateChat(ctx context.Context, chat model.Chat) (uuid.UUID, error) {
	return s.queries.CreateChat(ctx, db2.CreateChatParams{
		ID: uuid.Must(uuid.NewV7()),
		Name: pgtype.Text{
			String: chat.Name,
			Valid:  true,
		},
		Type: chat.Type,
		CreatedAt: pgtype.Timestamptz{
			Time:  time.Now(),
			Valid: true,
		},
	})
}

func (s *Service) JoinUserToChat(ctx context.Context, userID uuid.UUID, chatID uuid.UUID) error {
	return s.queries.AddUserToChat(ctx, db2.AddUserToChatParams{
		ID:     uuid.Must(uuid.NewV7()),
		ChatID: chatID,
		UserID: userID,
		JoinedAt: pgtype.Timestamptz{
			Time:  time.Now(),
			Valid: true,
		},
	})
}
