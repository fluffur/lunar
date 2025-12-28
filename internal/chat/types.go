package chat

import (
	"github.com/google/uuid"
)

type CreateParams struct {
	Name string `json:"name,omitempty"`
	Type string `json:"type"`
}

type CreateResponse struct {
	ID uuid.UUID `json:"id"`
}
