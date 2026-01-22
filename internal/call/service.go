package call

import (
	"context"
	"fmt"
	"lunar/internal/livekit"
	"lunar/internal/repository"
	"lunar/internal/room"
	"lunar/internal/ws"

	"github.com/google/uuid"
)

type Service struct {
	livekitService *livekit.Service
	wsService      *ws.Service
	userRepo       repository.UserRepository
	roomService    *room.Service
	repo           repository.CallRepository
}

func NewService(livekitService *livekit.Service, wsService *ws.Service, userRepo repository.UserRepository, roomService *room.Service, repo repository.CallRepository) *Service {
	return &Service{
		livekitService: livekitService,
		wsService:      wsService,
		userRepo:       userRepo,
		roomService:    roomService,
		repo:           repo,
	}
}

func (s *Service) InitiateCall(ctx context.Context, callerID, calleeID uuid.UUID) (*StartCallResponse, error) {
	caller, err := s.userRepo.GetByID(ctx, callerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get caller: %w", err)
	}

	_, err = s.userRepo.GetByID(ctx, calleeID)
	if err != nil {
		return nil, fmt.Errorf("failed to get callee: %w", err)
	}

	room, err := s.roomService.GetOrCreateRoom(ctx, []uuid.UUID{callerID, calleeID})
	if err != nil {
		return nil, fmt.Errorf("failed to get or create room: %w", err)
	}

	roomSlug := room.Slug

	token, err := s.livekitService.GenerateToken(roomSlug, callerID, caller.Username, caller.AvatarURL)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	payload := ws.IncomingCallPayload{
		CallerID:        caller.ID,
		CallerName:      caller.Username,
		CallerAvatarUrl: caller.AvatarURL,
		RoomName:        roomSlug,
	}

	if err := s.repo.SaveActiveCall(ctx, calleeID, roomSlug, callerID, caller.Username); err != nil {
		return nil, fmt.Errorf("failed to save active call: %w", err)
	}

	if err := s.wsService.PublishUserEvent(ctx, calleeID, ws.MsgIncomingCall, payload); err != nil {
		return nil, fmt.Errorf("failed to signal callee: %w", err)
	}

	return &StartCallResponse{
		RoomName: roomSlug,
		Token:    token,
	}, nil
}

func (s *Service) CheckActiveCall(ctx context.Context, userID uuid.UUID) (*ws.IncomingCallPayload, error) {
	roomName, callerID, callerName, exists, err := s.repo.GetActiveCall(ctx, userID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, nil
	}

	caller, err := s.userRepo.GetByID(ctx, callerID)
	avatarUrl := ""
	if err == nil {
		avatarUrl = caller.AvatarURL
	}

	return &ws.IncomingCallPayload{
		CallerID:        callerID,
		CallerName:      callerName,
		CallerAvatarUrl: avatarUrl,
		RoomName:        roomName,
	}, nil
}

func (s *Service) ClearActiveCall(ctx context.Context, userID uuid.UUID) error {
	return s.repo.RemoveActiveCall(ctx, userID)
}
