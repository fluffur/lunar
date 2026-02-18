package repository

import (
	"context"
	"lunar/internal/model"

	"github.com/google/uuid"
)

type ServerRepository interface {
	Create(ctx context.Context, server model.Server) (model.Server, error)
	GetByID(ctx context.Context, id uuid.UUID) (model.Server, error)
	Delete(ctx context.Context, id uuid.UUID) error

	// Member management
	AddMember(ctx context.Context, serverID, userID uuid.UUID) error
	RemoveMember(ctx context.Context, serverID, userID uuid.UUID) error
	GetMember(ctx context.Context, serverID, userID uuid.UUID) (model.ServerMember, error)
	ListMembers(ctx context.Context, serverID uuid.UUID) ([]model.ServerMember, error)
	UpdateNickname(ctx context.Context, serverID, userID uuid.UUID, nickname string) error

	// Role management
	CreateRole(ctx context.Context, role model.ServerRole) (model.ServerRole, error)
	UpdateRole(ctx context.Context, role model.ServerRole) (model.ServerRole, error)
	DeleteRole(ctx context.Context, serverID, roleID uuid.UUID) error
	AssignRole(ctx context.Context, memberID, roleID uuid.UUID) error
	RemoveRole(ctx context.Context, memberID, roleID uuid.UUID) error
	ListRoles(ctx context.Context, serverID uuid.UUID) ([]model.ServerRole, error)

	// Channel management (using Room models)
	CreateChannel(ctx context.Context, room model.Room) (model.Room, error)
	ListChannels(ctx context.Context, serverID uuid.UUID) ([]model.Room, error)
}
