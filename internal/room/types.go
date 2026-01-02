package room

import (
	"lunar/internal/model"

	"github.com/google/uuid"
)

type CreateRequest struct {
	Name string `json:"name" validate:"min=3,max=50,alphanumspace"`
}

type CreateResponse struct {
	ID uuid.UUID `json:"id" binding:"required"`
}

type ListResponse struct {
	Rooms []model.Room `json:"rooms" binding:"required"`
}
