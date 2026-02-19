package postgres

import (
	"context"
	db "lunar/internal/db/postgres/sqlc"
	"lunar/internal/model"
	"lunar/internal/repository"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type ServerRepository struct {
	queries db.Querier
}

func NewServerRepository(queries db.Querier) repository.ServerRepository {
	return &ServerRepository{queries}
}

func (r *ServerRepository) Create(ctx context.Context, s model.Server) (model.Server, error) {
	row, err := r.queries.CreateServer(ctx, db.CreateServerParams{
		ID:        s.ID,
		Name:      s.Name,
		OwnerID:   s.OwnerID,
		AvatarUrl: textOrNil(s.AvatarURL),
		CreatedAt: timestampFromTime(s.CreatedAt),
	})
	if err != nil {
		return model.Server{}, err
	}

	return model.Server{
		ID:        row.ID,
		Name:      row.Name,
		OwnerID:   row.OwnerID,
		AvatarURL: stringPtrFromText(row.AvatarUrl),
		CreatedAt: timeFromTimestamp(row.CreatedAt),
	}, nil
}

func (r *ServerRepository) GetByID(ctx context.Context, id uuid.UUID) (model.Server, error) {
	row, err := r.queries.GetServerByID(ctx, id)
	if err != nil {
		return model.Server{}, err
	}

	return model.Server{
		ID:        row.ID,
		Name:      row.Name,
		OwnerID:   row.OwnerID,
		AvatarURL: stringPtrFromText(row.AvatarUrl),
		CreatedAt: timeFromTimestamp(row.CreatedAt),
	}, nil
}

func (r *ServerRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.queries.DeleteServer(ctx, id)
}

func (r *ServerRepository) AddMember(ctx context.Context, serverID, userID uuid.UUID) error {
	return r.queries.AddServerMember(ctx, db.AddServerMemberParams{
		ID:       uuid.Must(uuid.NewV7()),
		ServerID: serverID,
		UserID:   userID,
		Nickname: pgtype.Text{Valid: false},
		JoinedAt: timestampFromTime(time.Now()),
	})
}

func (r *ServerRepository) RemoveMember(ctx context.Context, serverID, userID uuid.UUID) error {
	return r.queries.RemoveServerMember(ctx, db.RemoveServerMemberParams{
		ServerID: serverID,
		UserID:   userID,
	})
}

func (r *ServerRepository) GetMember(ctx context.Context, serverID, userID uuid.UUID) (model.ServerMember, error) {
	row, err := r.queries.GetServerMember(ctx, db.GetServerMemberParams{
		ServerID: serverID,
		UserID:   userID,
	})
	if err != nil {
		return model.ServerMember{}, err
	}

	return model.ServerMember{
		ID:       row.ID,
		ServerID: row.ServerID,
		UserID:   row.UserID,
		Nickname: stringPtrFromText(row.Nickname),
		JoinedAt: timeFromTimestamp(row.JoinedAt),
	}, nil
}

func (r *ServerRepository) ListMembers(ctx context.Context, serverID uuid.UUID) ([]model.ServerMember, error) {
	rows, err := r.queries.ListServerMembers(ctx, serverID)
	if err != nil {
		return nil, err
	}

	members := make([]model.ServerMember, len(rows))
	for i, row := range rows {
		members[i] = model.ServerMember{
			ID:       row.ID,
			ServerID: row.ServerID,
			UserID:   row.UserID,
			Nickname: stringPtrFromText(row.Nickname),
			JoinedAt: timeFromTimestamp(row.JoinedAt),
			User: &model.User{
				ID:        row.UserID,
				Username:  row.Username,
				AvatarURL: textOrEmpty(row.UserAvatarUrl),
			},
		}
	}
	return members, nil
}

func (r *ServerRepository) UpdateNickname(ctx context.Context, serverID, userID uuid.UUID, nickname string) error {
	return r.queries.UpdateServerMemberNickname(ctx, db.UpdateServerMemberNicknameParams{
		ServerID: serverID,
		UserID:   userID,
		Nickname: textFromString(nickname),
	})
}

func (r *ServerRepository) CreateRole(ctx context.Context, role model.ServerRole) (model.ServerRole, error) {
	row, err := r.queries.CreateServerRole(ctx, db.CreateServerRoleParams{
		ID:          role.ID,
		ServerID:    role.ServerID,
		Name:        role.Name,
		Color:       textOrNil(role.Color),
		Permissions: role.Permissions,
		Position:    int32(role.Position),
		CreatedAt:   timestampFromTime(role.CreatedAt),
	})
	if err != nil {
		return model.ServerRole{}, err
	}

	return model.ServerRole{
		ID:          row.ID,
		ServerID:    row.ServerID,
		Name:        row.Name,
		Color:       stringPtrFromText(row.Color),
		Permissions: row.Permissions,
		Position:    int(row.Position),
		CreatedAt:   timeFromTimestamp(row.CreatedAt),
	}, nil
}

func (r *ServerRepository) UpdateRole(ctx context.Context, role model.ServerRole) (model.ServerRole, error) {
	row, err := r.queries.UpdateServerRole(ctx, db.UpdateServerRoleParams{
		ID:          role.ID,
		ServerID:    role.ServerID,
		Name:        role.Name,
		Color:       textOrNil(role.Color),
		Permissions: role.Permissions,
		Position:    int32(role.Position),
	})
	if err != nil {
		return model.ServerRole{}, err
	}

	return model.ServerRole{
		ID:          row.ID,
		ServerID:    row.ServerID,
		Name:        row.Name,
		Color:       stringPtrFromText(row.Color),
		Permissions: row.Permissions,
		Position:    int(row.Position),
		CreatedAt:   timeFromTimestamp(row.CreatedAt),
	}, nil
}

func (r *ServerRepository) DeleteRole(ctx context.Context, serverID, roleID uuid.UUID) error {
	return r.queries.DeleteServerRole(ctx, db.DeleteServerRoleParams{
		ID:       roleID,
		ServerID: serverID,
	})
}

func (r *ServerRepository) AssignRole(ctx context.Context, memberID, roleID uuid.UUID) error {
	return r.queries.AssignRoleToMember(ctx, db.AssignRoleToMemberParams{
		MemberID: memberID,
		RoleID:   roleID,
	})
}

func (r *ServerRepository) RemoveRole(ctx context.Context, memberID, roleID uuid.UUID) error {
	return r.queries.RemoveRoleFromMember(ctx, db.RemoveRoleFromMemberParams{
		MemberID: memberID,
		RoleID:   roleID,
	})
}

func (r *ServerRepository) ListRoles(ctx context.Context, serverID uuid.UUID) ([]model.ServerRole, error) {
	rows, err := r.queries.ListServerRoles(ctx, serverID)
	if err != nil {
		return nil, err
	}

	roles := make([]model.ServerRole, len(rows))
	for i, row := range rows {
		roles[i] = model.ServerRole{
			ID:          row.ID,
			ServerID:    row.ServerID,
			Name:        row.Name,
			Color:       stringPtrFromText(row.Color),
			Permissions: row.Permissions,
			Position:    int(row.Position),
			CreatedAt:   timeFromTimestamp(row.CreatedAt),
		}
	}
	return roles, nil
}

func (r *ServerRepository) CreateChannel(ctx context.Context, room model.Room) (model.Room, error) {
	row, err := r.queries.CreateChannel(ctx, db.CreateChannelParams{
		ID:        room.ID,
		Name:      textFromString(room.Name),
		Slug:      room.Slug,
		ServerID:  uuidOrNil(room.ServerID),
		Type:      string(room.Type),
		Position:  int32(room.Position),
		CreatedAt: timestampFromTime(room.CreatedAt),
	})
	if err != nil {
		return model.Room{}, err
	}

	return model.Room{
		ID:        row.ID,
		Name:      row.Name.String,
		Slug:      row.Slug,
		ServerID:  uuidFromPgUUID(row.ServerID),
		Type:      model.RoomType(row.Type),
		Position:  int(row.Position),
		CreatedAt: timeFromTimestamp(row.CreatedAt),
	}, nil
}

func (r *ServerRepository) ListChannels(ctx context.Context, serverID uuid.UUID) ([]model.Room, error) {
	rows, err := r.queries.ListServerChannels(ctx, uuidOrNil(&serverID))
	if err != nil {
		return nil, err
	}

	channels := make([]model.Room, len(rows))
	for i, row := range rows {
		channels[i] = model.Room{
			ID:        row.ID,
			Name:      row.Name.String,
			Slug:      row.Slug,
			ServerID:  uuidFromPgUUID(row.ServerID),
			Type:      model.RoomType(row.Type),
			Position:  int(row.Position),
			CreatedAt: timeFromTimestamp(row.CreatedAt),
		}
	}
	return channels, nil
}

func uuidFromPgUUID(u pgtype.UUID) *uuid.UUID {
	if u.Valid {
		res := uuid.UUID(u.Bytes)
		return &res
	}
	return nil
}
