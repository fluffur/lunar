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
)

type Service struct {
	roomRepo    repository.RoomRepository
	messageRepo repository.MessageRepository
}

var (
	ErrRoomNotFound = errors.New("room not found")
)

func NewService(roomRepo repository.RoomRepository, messageRepo repository.MessageRepository) *Service {
	return &Service{roomRepo, messageRepo}
}

func (s *Service) ListMessages(ctx context.Context, roomSlug string, limit int, cursor *pagination.Cursor) ([]model.Message, error) {
	room, err := s.roomRepo.GetBySlug(ctx, roomSlug)
	if err != nil {
		if errors.Is(err, repository.ErrRoomNotFound) {
			return nil, ErrRoomNotFound
		}
		return nil, err
	}

	return s.messageRepo.ListMessages(ctx, room.ID, limit, cursor)
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
