package repository

import (
	"context"
	"lunar/internal/model"

	"github.com/google/uuid"
)

type FriendshipRepository interface {
	CreateFriendRequest(ctx context.Context, fromID, toID uuid.UUID, message string) error
	GetFriendRequest(ctx context.Context, fromID, toID uuid.UUID) (model.FriendRequest, error)
	ListIncomingRequest(ctx context.Context, userID uuid.UUID) ([]model.FriendRequest, error)
	ListOutgoingRequest(ctx context.Context, userID uuid.UUID) ([]model.FriendRequest, error)
	DeleteFriendRequest(ctx context.Context, fromID, toID uuid.UUID) error

	InsertFriendshipEdge(ctx context.Context, userID, friendID uuid.UUID) error
	DeleteFriendshipEdge(ctx context.Context, userID, friendID uuid.UUID) error
	ListFriends(ctx context.Context, userID uuid.UUID) ([]model.Friendship, error)

	IsBlocked(ctx context.Context, fromID, toID uuid.UUID) (bool, error)
	CreateBlock(ctx context.Context, fromID, toID uuid.UUID) error
	DeleteBlock(ctx context.Context, fromID, toID uuid.UUID) error
	ListBlocked(ctx context.Context, fromID uuid.UUID) ([]model.Block, error)

	AcceptFriendRequest(ctx context.Context, toID, fromID uuid.UUID) error
	RemoveFriend(ctx context.Context, userID, friendID uuid.UUID) error
}
