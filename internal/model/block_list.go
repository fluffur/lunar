package model

import (
	"time"

	"github.com/google/uuid"
)

type Block struct {
	FromUserID uuid.UUID `json:"fromUserId"`
	ToUserID   uuid.UUID `json:"toUserId"`
	CreatedAt  time.Time `json:"createdAt"`
}
