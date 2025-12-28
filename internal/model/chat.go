package model

import "github.com/google/uuid"

type Chat struct {
	ID   uuid.UUID `json:"id" binding:"required"`
	Name string    `json:"name,omitempty"`
	Type string    `json:"type" binding:"required"`
}
