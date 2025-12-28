package chat

import (
	"lunar/internal/model"

	"github.com/google/uuid"
)

type CreateResponse struct {
	ID uuid.UUID `json:"id" binding:"required"`
}

type ListResponse struct {
	Chats []model.Chat `json:"chats" binding:"required"`
}
