package postgres

import (
	"context"
	"errors"
	db "lunar/internal/db/postgres/sqlc"
	"lunar/internal/model"
	"lunar/internal/repository"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type FriendshipRepository struct {
	pool    *pgxpool.Pool
	queries *db.Queries
}

func NewFriendshipRepository(pool *pgxpool.Pool, queries *db.Queries) *FriendshipRepository {
	return &FriendshipRepository{
		pool:    pool,
		queries: queries,
	}
}

func mapFriendRequest(r db.FriendRequest) model.FriendRequest {
	var respondedAt *time.Time
	if r.RespondedAt.Valid {
		t := r.RespondedAt.Time
		respondedAt = &t
	}

	return model.FriendRequest{
		FromUserID:  r.FromUserID,
		ToUserID:    r.ToUserID,
		Status:      model.FriendRequestStatus(r.Status),
		Message:     r.Message,
		CreatedAt:   r.CreatedAt.Time,
		RespondedAt: respondedAt,
	}
}

func mapFriendRequests(rows []db.FriendRequest) []model.FriendRequest {
	out := make([]model.FriendRequest, 0, len(rows))
	for _, r := range rows {
		out = append(out, mapFriendRequest(r))
	}
	return out
}

func mapFriendship(r db.Friendship) model.Friendship {
	return model.Friendship{
		UserID:    r.UserID,
		FriendID:  r.FriendID,
		CreatedAt: r.CreatedAt.Time,
	}
}

func mapFriendships(rows []db.Friendship) []model.Friendship {
	out := make([]model.Friendship, 0, len(rows))
	for _, r := range rows {
		out = append(out, mapFriendship(r))
	}
	return out
}

func mapBlock(r db.UserBlock) model.Block {
	return model.Block{
		FromUserID: r.FromUserID,
		ToUserID:   r.ToUserID,
		CreatedAt:  r.CreatedAt.Time,
	}
}

func mapBlocks(rows []db.UserBlock) []model.Block {
	out := make([]model.Block, 0, len(rows))
	for _, r := range rows {
		out = append(out, mapBlock(r))
	}
	return out
}

func (r *FriendshipRepository) CreateFriendRequest(ctx context.Context, fromID, toID uuid.UUID, message string) error {
	return r.queries.CreateFriendRequest(ctx, db.CreateFriendRequestParams{
		FromUserID: fromID,
		ToUserID:   toID,
		Message:    message,
	})
}

func (r *FriendshipRepository) GetFriendRequest(ctx context.Context, fromID, toID uuid.UUID) (model.FriendRequest, error) {
	req, err := r.queries.GetFriendRequest(ctx, db.GetFriendRequestParams{
		FromUserID: fromID,
		ToUserID:   toID,
	})

	if err != nil {
		return model.FriendRequest{}, err
	}
	return mapFriendRequest(req), nil
}

func (r *FriendshipRepository) DeleteFriendRequest(ctx context.Context, fromID, toID uuid.UUID) error {
	return r.queries.DeleteFriendRequest(ctx, db.DeleteFriendRequestParams{
		FromUserID: fromID,
		ToUserID:   toID,
	})
}

func (r *FriendshipRepository) IsBlocked(ctx context.Context, fromID, toID uuid.UUID) (bool, error) {
	return r.queries.IsBlocked(ctx, db.IsBlockedParams{
		FromUserID: fromID,
		ToUserID:   toID,
	})
}

func (r *FriendshipRepository) CreateBlock(ctx context.Context, fromID, toID uuid.UUID) error {
	return r.queries.CreateBlock(ctx, db.CreateBlockParams{
		FromUserID: fromID,
		ToUserID:   toID,
	})
}

func (r *FriendshipRepository) DeleteBlock(ctx context.Context, fromID, toID uuid.UUID) error {
	return r.queries.DeleteBlock(ctx, db.DeleteBlockParams{
		FromUserID: fromID,
		ToUserID:   toID,
	})
}

func (r *FriendshipRepository) ListBlocked(ctx context.Context, fromID uuid.UUID) ([]model.Block, error) {
	rows, err := r.queries.ListBlocked(ctx, fromID)
	if err != nil {
		return nil, err
	}
	return mapBlocks(rows), nil
}

func (r *FriendshipRepository) AcceptFriendRequest(ctx context.Context, toID, fromID uuid.UUID) error {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	qtx := r.queries.WithTx(tx)

	req, err := qtx.GetFriendRequest(ctx, db.GetFriendRequestParams{
		ToUserID:   toID,
		FromUserID: fromID,
	})

	if err != nil {
		return err
	}

	if req.Status != string(model.FriendRequestStatusPending) {
		return errors.New("not pending friend")
	}

	if err := qtx.DeleteFriendRequest(ctx, db.DeleteFriendRequestParams{FromUserID: fromID, ToUserID: toID}); err != nil {
		return err
	}

	if err := qtx.InsertFriendshipEdge(ctx, db.InsertFriendshipEdgeParams{UserID: fromID, FriendID: toID}); err != nil {
		return err
	}
	if err := qtx.InsertFriendshipEdge(ctx, db.InsertFriendshipEdgeParams{UserID: toID, FriendID: fromID}); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *FriendshipRepository) RemoveFriend(ctx context.Context, userID, friendID uuid.UUID) error {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	qtx := r.queries.WithTx(tx)

	if err := qtx.DeleteFriendshipEdge(ctx, db.DeleteFriendshipEdgeParams{UserID: userID, FriendID: friendID}); err != nil {
		return err
	}
	if err := qtx.DeleteFriendshipEdge(ctx, db.DeleteFriendshipEdgeParams{UserID: friendID, FriendID: userID}); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *FriendshipRepository) ListFriendsWithUsers(ctx context.Context, userID uuid.UUID) ([]db.ListFriendsWithUsersRow, error) {
	return r.queries.ListFriendsWithUsers(ctx, userID)
}

func (r *FriendshipRepository) ListIncomingRequestsWithUsers(ctx context.Context, userID uuid.UUID) ([]db.ListIncomingRequestsWithUsersRow, error) {
	return r.queries.ListIncomingRequestsWithUsers(ctx, userID)
}

func (r *FriendshipRepository) ListOutgoingRequestsWithUsers(ctx context.Context, userID uuid.UUID) ([]db.ListOutgoingRequestsWithUsersRow, error) {
	return r.queries.ListOutgoingRequestsWithUsers(ctx, userID)
}

var _ repository.FriendshipRepository = (*FriendshipRepository)(nil)
