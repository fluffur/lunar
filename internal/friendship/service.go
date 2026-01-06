package friendship

import (
	"context"
	"errors"
	"lunar/internal/model"
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
	ErrNotFriends            = errors.New("users are not friends")
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

func (s *FriendshipService) SendFriendRequest(ctx context.Context, fromID uuid.UUID, username string, message string) error {
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

	// Check if blocked
	blocked, err := s.repo.IsBlocked(ctx, fromID, toID)
	if err != nil {
		return err
	}
	if blocked {
		return ErrBlocked
	}

	friends, err := s.repo.ListFriends(ctx, fromID)
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

func (s *FriendshipService) RejectFriendRequest(ctx context.Context, userID uuid.UUID, fromID uuid.UUID) error {
	_, err := s.repo.GetFriendRequest(ctx, fromID, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrFriendRequestNotFound
		}
		return err
	}

	return s.repo.DeleteFriendRequest(ctx, fromID, userID)
}

func (s *FriendshipService) CancelFriendRequest(ctx context.Context, fromID uuid.UUID, toID uuid.UUID) error {
	_, err := s.repo.GetFriendRequest(ctx, fromID, toID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrFriendRequestNotFound
		}
		return err
	}

	return s.repo.DeleteFriendRequest(ctx, fromID, toID)
}

func (s *FriendshipService) ListFriends(ctx context.Context, userID uuid.UUID) ([]model.Friendship, error) {
	return s.repo.ListFriends(ctx, userID)
}

func (s *FriendshipService) ListIncomingRequests(ctx context.Context, userID uuid.UUID) ([]model.FriendRequest, error) {
	return s.repo.ListIncomingRequest(ctx, userID)
}

func (s *FriendshipService) ListOutgoingRequests(ctx context.Context, userID uuid.UUID) ([]model.FriendRequest, error) {
	return s.repo.ListOutgoingRequest(ctx, userID)
}

func (s *FriendshipService) RemoveFriend(ctx context.Context, userID uuid.UUID, friendID uuid.UUID) error {
	friends, err := s.repo.ListFriends(ctx, userID)
	if err != nil {
		return err
	}

	found := false
	for _, f := range friends {
		if f.FriendID == friendID {
			found = true
			break
		}
	}

	if !found {
		return ErrNotFriends
	}

	return s.repo.RemoveFriend(ctx, userID, friendID)
}
