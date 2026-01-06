package model

import (
	"time"

	"github.com/google/uuid"
)

type Friendship struct {
	UserID    uuid.UUID `json:"userId"`
	FriendID  uuid.UUID `json:"friendId"`
	CreatedAt time.Time `json:"createdAt"`
}
