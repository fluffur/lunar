package message

import (
	"lunar/internal/model"
)

type GetPagingResponse struct {
	Messages   []model.Message `json:"messages"`
	NextCursor string          `json:"nextCursor"`
}
