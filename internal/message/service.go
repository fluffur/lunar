package message

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	db "lunar/internal/db/sqlc"
	"lunar/internal/model"
	"strconv"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Service struct {
	queries *db.Queries
	db      *pgxpool.Pool
}

var (
	ErrChatNotFound = errors.New("chat not found")
)

func NewService(queries *db.Queries, db *pgxpool.Pool) *Service {
	return &Service{
		queries: queries,
		db:      db,
	}
}

func (s *Service) ListMessages(ctx context.Context, chatID uuid.UUID, limit int, cursor *Cursor) ([]model.Message, error) {
	tx, err := s.db.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.ReadCommitted})
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	exists, err := qtx.ChatExists(ctx, chatID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrChatNotFound
	}

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

	rows, err := qtx.GetMessagesPaging(ctx, params)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return model.MessagesFromRepo(rows), nil
}

func (s *Service) GenerateCursor(message model.Message) string {
	c := Cursor{
		ID:        message.ID,
		CreatedAt: message.CreatedAt,
	}

	b, _ := json.Marshal(c)

	return base64.StdEncoding.EncodeToString(b)
}

func (s *Service) ParseCursor(cursorEncoded string) (Cursor, error) {
	var cursor Cursor

	decoded, err := base64.StdEncoding.DecodeString(cursorEncoded)
	if err != nil {
		return cursor, err
	}

	if err := json.Unmarshal(decoded, &cursor); err != nil {
		return cursor, err
	}

	return cursor, nil
}

func (s *Service) NormalizeLimit(limit string, max int, fallback int) int {
	if limit == "" {
		return fallback
	}

	result, err := strconv.Atoi(limit)
	if err != nil {
		return fallback
	}

	if result < 0 || result > max {
		return fallback
	}

	return result
}
