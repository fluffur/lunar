package repository

import (
	"context"

	"github.com/google/uuid"
)

type CallRepository interface {
	SaveActiveCall(ctx context.Context, userID uuid.UUID, roomName string, callerID uuid.UUID, callerName string) error
	GetActiveCall(ctx context.Context, userID uuid.UUID) (roomName string, callerID uuid.UUID, callerName string, exists bool, err error)
	RemoveActiveCall(ctx context.Context, userID uuid.UUID) error
}
