package message

import (
	"lunar/internal/model/message"
)

type messagesResponse struct {
	Messages   []message.Message `json:"messages"`
	NextCursor string            `json:"nextCursor"`
}
