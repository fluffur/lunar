package message

import (
	"lunar/internal/model"
)

type messagesResponse struct {
	Messages   []model.Message `json:"messages"`
	NextCursor string          `json:"nextCursor"`
}
