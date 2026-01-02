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
	chatRepo    repository.ChatRepository
	messageRepo repository.MessageRepository
}

var (
	ErrChatNotFound = errors.New("chat not found")
)

func NewService(chatRepository repository.ChatRepository, messageRepository repository.MessageRepository) *Service {
	return &Service{chatRepository, messageRepository}
}

func (s *Service) ListMessages(ctx context.Context, chatID uuid.UUID, limit int, cursor *pagination.Cursor) ([]model.Message, error) {
	exists, err := s.chatRepo.ChatExists(ctx, chatID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrChatNotFound
	}

	return s.messageRepo.ListMessages(ctx, chatID, limit, cursor)
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
