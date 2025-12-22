package message

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	repo "lunar/internal/adapters/postgresql/sqlc"
	"lunar/internal/api/message"
	"strconv"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type svc struct {
	repo *repo.Queries
	db   *pgxpool.Pool
}

var (
	ErrChatNotFound  = errors.New("chat not found")
	ErrInvalidCursor = errors.New("invalid cursor")
)

func NewService(repo *repo.Queries, db *pgxpool.Pool) Service {
	return &svc{
		repo: repo,
		db:   db,
	}
}

func (s *svc) ListMessages(ctx context.Context, chatID uuid.UUID, limit int, cursor *Cursor) ([]message.Message, error) {
	tx, err := s.db.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.ReadCommitted})
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	qtx := s.repo.WithTx(tx)

	exists, err := qtx.ChatExists(ctx, chatID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrChatNotFound
	}

	params := repo.GetMessagesPagingParams{
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

	return message.MessagesFromRepo(rows), nil
}

func (s *svc) GenerateCursor(message message.Message) string {
	c := Cursor{
		ID:        message.ID,
		CreatedAt: message.CreatedAt,
	}

	b, _ := json.Marshal(c)

	return base64.StdEncoding.EncodeToString(b)
}

func (s *svc) ParseCursor(cursorEncoded string) (Cursor, error) {
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

func (s *svc) NormalizeLimit(limit string, max int, fallback int) int {
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
