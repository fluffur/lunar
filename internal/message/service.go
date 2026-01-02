package message

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"lunar/internal/model"
	"lunar/internal/pagination"
	"lunar/internal/repository"
	"strconv"

	"github.com/google/uuid"
)

type Service struct {
	roomRepo    repository.RoomRepository
	messageRepo repository.MessageRepository
}

var (
	ErrChatNotFound = errors.New("room not found")
)

func NewService(roomRepo repository.RoomRepository, messageRepo repository.MessageRepository) *Service {
	return &Service{roomRepo, messageRepo}
}

func (s *Service) ListMessages(ctx context.Context, roomID uuid.UUID, limit int, cursor *pagination.Cursor) ([]model.Message, error) {
	exists, err := s.roomRepo.RoomExists(ctx, roomID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrChatNotFound
	}

	return s.messageRepo.ListMessages(ctx, roomID, limit, cursor)
}

func (s *Service) GenerateCursor(message model.Message) string {
	c := pagination.Cursor{
		ID:        message.ID,
		CreatedAt: message.CreatedAt,
	}

	b, _ := json.Marshal(c)

	return base64.StdEncoding.EncodeToString(b)
}

func (s *Service) ParseCursor(cursorEncoded string) (pagination.Cursor, error) {
	var cursor pagination.Cursor

	decoded, err := base64.StdEncoding.DecodeString(cursorEncoded)
	if err != nil {
		return cursor, err
	}

	if err := json.Unmarshal(decoded, &cursor); err != nil {
		return cursor, err
	}

	return cursor, nil
}

func normalizeLimit(limit string, max int, fallback int) int {
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
