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
	return s.repo.RemoveFriend(ctx, userID, friendID)
}

type FriendWithInfo struct {
	ID        string
	Username  string
	AvatarURL string
}

type FriendRequestWithInfo struct {
	FromUserID  string
	ToUserID    string
	Status      string
	Message     string
	CreatedAt   string
	RespondedAt *string
	FromUser    *FriendWithInfo
	ToUser      *FriendWithInfo
}

func (s *FriendshipService) ListFriendsWithInfo(ctx context.Context, userID uuid.UUID) ([]FriendWithInfo, error) {
	friendships, err := s.repo.ListFriends(ctx, userID)
	if err != nil {
		return nil, err
	}

	friends := make([]FriendWithInfo, 0, len(friendships))
	for _, f := range friendships {
		user, err := s.userRepo.GetByID(ctx, f.FriendID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				continue
			}
			return nil, err
		}

		friends = append(friends, FriendWithInfo{
			ID:        user.ID.String(),
			Username:  user.Username,
			AvatarURL: user.AvatarURL,
		})
	}

	return friends, nil
}

func (s *FriendshipService) ListIncomingRequestsWithInfo(ctx context.Context, userID uuid.UUID) ([]FriendRequestWithInfo, error) {
	requests, err := s.repo.ListIncomingRequest(ctx, userID)
	if err != nil {
		return nil, err
	}

	responses := make([]FriendRequestWithInfo, 0, len(requests))
	for _, req := range requests {
		fromUser, err := s.userRepo.GetByID(ctx, req.FromUserID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				continue
			}
			return nil, err
		}

		response := FriendRequestWithInfo{
			FromUserID: req.FromUserID.String(),
			ToUserID:   req.ToUserID.String(),
			Status:     string(req.Status),
			Message:    req.Message,
			CreatedAt:  req.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			FromUser: &FriendWithInfo{
				ID:        fromUser.ID.String(),
				Username:  fromUser.Username,
				AvatarURL: fromUser.AvatarURL,
			},
		}

		if req.RespondedAt != nil {
			respondedAt := req.RespondedAt.Format("2006-01-02T15:04:05Z07:00")
			response.RespondedAt = &respondedAt
		}

		responses = append(responses, response)
	}

	return responses, nil
}

func (s *FriendshipService) ListOutgoingRequestsWithInfo(ctx context.Context, userID uuid.UUID) ([]FriendRequestWithInfo, error) {
	requests, err := s.repo.ListOutgoingRequest(ctx, userID)
	if err != nil {
		return nil, err
	}

	responses := make([]FriendRequestWithInfo, 0, len(requests))
	for _, req := range requests {
		toUser, err := s.userRepo.GetByID(ctx, req.ToUserID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				continue
			}
			return nil, err
		}

		response := FriendRequestWithInfo{
			FromUserID: req.FromUserID.String(),
			ToUserID:   req.ToUserID.String(),
			Status:     string(req.Status),
			Message:    req.Message,
			CreatedAt:  req.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			ToUser: &FriendWithInfo{
				ID:        toUser.ID.String(),
				Username:  toUser.Username,
				AvatarURL: toUser.AvatarURL,
			},
		}

		if req.RespondedAt != nil {
			respondedAt := req.RespondedAt.Format("2006-01-02T15:04:05Z07:00")
			response.RespondedAt = &respondedAt
		}

		responses = append(responses, response)
	}

	return responses, nil
}
