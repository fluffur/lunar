package repository

import (
	"context"
	db "lunar/internal/db/postgres/sqlc"
	"lunar/internal/model"

	"github.com/google/uuid"
)

type FriendshipRepository interface {
	CreateFriendRequest(ctx context.Context, fromID, toID uuid.UUID, message string) error
	GetFriendRequest(ctx context.Context, fromID, toID uuid.UUID) (model.FriendRequest, error)
	DeleteFriendRequest(ctx context.Context, fromID, toID uuid.UUID) error

	IsBlocked(ctx context.Context, fromID, toID uuid.UUID) (bool, error)
	CreateBlock(ctx context.Context, fromID, toID uuid.UUID) error
	DeleteBlock(ctx context.Context, fromID, toID uuid.UUID) error
	ListBlocked(ctx context.Context, fromID uuid.UUID) ([]model.Block, error)

	AcceptFriendRequest(ctx context.Context, toID, fromID uuid.UUID) error
	RemoveFriend(ctx context.Context, userID, friendID uuid.UUID) error

	ListFriendsWithUsers(ctx context.Context, userID uuid.UUID) ([]db.ListFriendsWithUsersRow, error)
	ListIncomingRequestsWithUsers(ctx context.Context, userID uuid.UUID) ([]db.ListIncomingRequestsWithUsersRow, error)
	ListOutgoingRequestsWithUsers(ctx context.Context, userID uuid.UUID) ([]db.ListOutgoingRequestsWithUsersRow, error)
}
