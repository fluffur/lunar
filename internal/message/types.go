package message

import (
	"lunar/internal/model"
)

type messagesResponse struct {
	Messages   []model.Message `json:"messages"`
	NextCursor string          `json:"nextCursor"`
}

type MessagesSuccessResponse struct {
	Success bool             `json:"success" default:"true"`
	Data    messagesResponse `json:"data"`
}
