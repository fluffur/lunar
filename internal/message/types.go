package message

import (
	"lunar/internal/api/message"
)

type messagesResponse struct {
	Messages   []message.Message `json:"messages"`
	NextCursor string            `json:"nextCursor"`
}
