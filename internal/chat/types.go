package chat

import (
	"github.com/google/uuid"
)

type createChatParams struct {
	Name string `json:"name,omitempty"`
	Type string `json:"type"`
}

type createChatResponse struct {
	ID uuid.UUID `json:"id"`
}
