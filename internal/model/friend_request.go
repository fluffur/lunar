package model

import (
	"time"

	"github.com/google/uuid"
)

type FriendRequestStatus string

const (
	FriendRequestStatusPending  FriendRequestStatus = "pending"
	FriendRequestStatusApproved FriendRequestStatus = "approved"
	FriendRequestStatusRejected FriendRequestStatus = "rejected"
)

type FriendRequest struct {
	FromUserID  uuid.UUID           `json:"fromUserId"`
	ToUserID    uuid.UUID           `json:"toUserId"`
	Status      FriendRequestStatus `json:"status"`
	Message     string              `json:"message,omitempty"`
	CreatedAt   time.Time           `json:"createdAt"`
	RespondedAt *time.Time          `json:"respondedAt,omitempty"`
}
