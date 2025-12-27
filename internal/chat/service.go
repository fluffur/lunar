package chat

import (
	"context"
	db "lunar/internal/db/sqlc"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type Service struct {
	queries db.Querier
}

func NewService(q db.Querier) *Service {
	return &Service{
		queries: q,
	}
}

func (s *Service) GetChat(ctx context.Context, id uuid.UUID) (db.Chat, error) {
	return s.queries.GetChat(ctx, id)
}

func (s *Service) CreateChat(ctx context.Context, params createChatParams) (uuid.UUID, error) {
	return s.queries.CreateChat(ctx, db.CreateChatParams{
		ID: uuid.Must(uuid.NewV7()),
		Name: pgtype.Text{
			String: params.Name,
			Valid:  true,
		},
		Type: params.Type,
		CreatedAt: pgtype.Timestamptz{
			Time:  time.Now(),
			Valid: true,
		},
	})
}

func (s *Service) JoinUserToChat(ctx context.Context, userID uuid.UUID, chatID uuid.UUID) error {
	return s.queries.AddUserToChat(ctx, db.AddUserToChatParams{
		ID:     uuid.Must(uuid.NewV7()),
		ChatID: chatID,
		UserID: userID,
		JoinedAt: pgtype.Timestamptz{
			Time:  time.Now(),
			Valid: true,
		},
	})
}
