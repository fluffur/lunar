package room

import (
	"lunar/internal/model"

	"github.com/google/uuid"
)

type CreateRequest struct {
	Type string `json:"type" binding:"required"`
	Name string `json:"name"`
}

type CreateResponse struct {
	ID uuid.UUID `json:"id" binding:"required"`
}

type ListResponse struct {
	Rooms []model.Room `json:"rooms" binding:"required"`
}
