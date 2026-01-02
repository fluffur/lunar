package room

import (
	"lunar/internal/model"
)

type CreateRequest struct {
	Name string `json:"name" validate:"min=3,max=50,alphanumspace"`
}

type CreateResponse struct {
	Slug string `json:"slug" binding:"required"`
}

type ListResponse struct {
	Rooms []model.Room `json:"rooms" binding:"required"`
}
