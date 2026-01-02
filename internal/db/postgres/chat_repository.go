package postgres

import (
	"context"
	db "lunar/internal/db/postgres/sqlc"
	"lunar/internal/model"
	"lunar/internal/repository"

	"github.com/google/uuid"
)

type ChatRepository struct {
	queries db.Querier
}

func NewChatRepository(queries db.Querier) repository.ChatRepository {
	return &ChatRepository{queries}
}

func mapChat(chat db.Chat) model.Chat {
	return model.Chat{
		ID:   chat.ID,
		Name: chat.Name.String,
		Type: chat.Type,
	}
}

func mapChats(chats []db.Chat) []model.Chat {
	result := make([]model.Chat, len(chats))
	for i, chat := range chats {
		result[i] = mapChat(chat)
	}
	return result
}

func (r *ChatRepository) ListUserChats(ctx context.Context, userID uuid.UUID) ([]model.Chat, error) {
	chats, err := r.queries.GetUserChats(ctx, userID)
	if err != nil {
		return nil, err
	}
	return mapChats(chats), nil
}

func (r *ChatRepository) Create(ctx context.Context, chat model.Chat) (model.Chat, error) {
	createdChat, err := r.queries.CreateChat(ctx, db.CreateChatParams{
		ID:        chat.ID,
		Name:      textFromString(chat.Name),
		Type:      chat.Type,
		CreatedAt: timestampFromTime(chat.CreatedAt),
	})
	if err != nil {
		return model.Chat{}, err
	}
	return mapChat(createdChat), nil

}

func (r *ChatRepository) ChatExists(ctx context.Context, id uuid.UUID) (bool, error) {
	return r.queries.ChatExists(ctx, id)
}

func (r *ChatRepository) AddMember(ctx context.Context, chatID uuid.UUID, userID uuid.UUID) error {
	member := model.NewChatMember(chatID, userID)

	return r.queries.AddUserToChat(ctx, db.AddUserToChatParams{
		ID:       member.ID,
		ChatID:   member.ChatID,
		UserID:   member.UserID,
		JoinedAt: timestampFromTime(member.JoinedAt),
	})
}
