package friendship

import (
	"context"
	"errors"
	"lunar/internal/friendship/dto"
	"lunar/internal/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

var (
	ErrUserNotFound          = errors.New("user not found")
	ErrCannotAddSelf         = errors.New("cannot add yourself as a friend")
	ErrFriendRequestExists   = errors.New("friend request already exists")
	ErrAlreadyFriends        = errors.New("users are already friends")
	ErrFriendRequestNotFound = errors.New("friend request not found")
	ErrBlocked               = errors.New("user is blocked")
)

type FriendshipService struct {
	repo     repository.FriendshipRepository
	userRepo repository.UserRepository
}

func NewFriendshipService(repo repository.FriendshipRepository, userRepo repository.UserRepository) *FriendshipService {
	return &FriendshipService{
		repo:     repo,
		userRepo: userRepo,
	}
}

func (s *FriendshipService) SendFriendRequestByUsername(ctx context.Context, fromID uuid.UUID, username string, message string) error {
	toUser, err := s.userRepo.GetByLogin(ctx, username)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrUserNotFound
		}
		return err
	}

	toID := toUser.ID

	if fromID == toID {
		return ErrCannotAddSelf
	}

	blocked, err := s.repo.IsBlocked(ctx, fromID, toID)
	if err != nil {
		return err
	}
	if blocked {
		return ErrBlocked
	}

	friends, err := s.repo.ListFriendsWithUsers(ctx, fromID)
	if err != nil {
		return err
	}
	for _, f := range friends {
		if f.FriendID == toID {
			return ErrAlreadyFriends
		}
	}

	_, err = s.repo.GetFriendRequest(ctx, fromID, toID)
	if err == nil {
		return ErrFriendRequestExists
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return err
	}

	_, err = s.repo.GetFriendRequest(ctx, toID, fromID)
	if err == nil {
		return ErrFriendRequestExists
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return err
	}

	return s.repo.CreateFriendRequest(ctx, fromID, toID, message)
}

func (s *FriendshipService) AcceptFriendRequest(ctx context.Context, userID uuid.UUID, fromID uuid.UUID) error {
	_, err := s.repo.GetFriendRequest(ctx, fromID, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrFriendRequestNotFound
		}
		return err
	}

	return s.repo.AcceptFriendRequest(ctx, userID, fromID)
}

func (s *FriendshipService) DeleteFriendRequest(ctx context.Context, fromID uuid.UUID, toID uuid.UUID) error {
	_, err := s.repo.GetFriendRequest(ctx, fromID, toID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrFriendRequestNotFound
		}
		return err
	}

	return s.repo.DeleteFriendRequest(ctx, fromID, toID)
}

func (s *FriendshipService) RemoveFriend(ctx context.Context, userID uuid.UUID, friendID uuid.UUID) error {
	return s.repo.RemoveFriend(ctx, userID, friendID)
}

func (s *FriendshipService) ListFriendsWithInfo(ctx context.Context, userID uuid.UUID) ([]dto.FriendWithInfo, error) {
	rows, err := s.repo.ListFriendsWithUsers(ctx, userID)
	if err != nil {
		return nil, err
	}
	return mapFriendsWithInfo(rows), nil
}

func (s *FriendshipService) ListIncomingRequestsWithInfo(ctx context.Context, userID uuid.UUID) ([]dto.FriendRequestWithInfo, error) {
	rows, err := s.repo.ListIncomingRequestsWithUsers(ctx, userID)
	if err != nil {
		return nil, err
	}
	return mapIncomingRequestsWithInfo(rows), nil
}

func (s *FriendshipService) ListOutgoingRequestsWithInfo(ctx context.Context, userID uuid.UUID) ([]dto.FriendRequestWithInfo, error) {
	rows, err := s.repo.ListOutgoingRequestsWithUsers(ctx, userID)
	if err != nil {
		return nil, err
	}
	return mapOutgoingRequestsWithInfo(rows), nil
}
