package call

import (
	"context"
	"fmt"
	"lunar/internal/livekit"
	"lunar/internal/repository"
	"lunar/internal/ws"

	"github.com/google/uuid"
)

type Service struct {
	livekitService *livekit.Service
	wsService      *ws.Service
	userRepo       repository.UserRepository
}

func NewService(livekitService *livekit.Service, wsService *ws.Service, userRepo repository.UserRepository) *Service {
	return &Service{
		livekitService: livekitService,
		wsService:      wsService,
		userRepo:       userRepo,
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

	roomName := fmt.Sprintf("call_%s", uuid.New().String())

	token, err := s.livekitService.GenerateToken(roomName, callerID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	payload := ws.IncomingCallPayload{
		CallerID:   caller.ID,
		CallerName: caller.Username,
		RoomName:   roomName,
	}

	if err := s.wsService.PublishUserEvent(ctx, calleeID, ws.MsgIncomingCall, payload); err != nil {
		return nil, fmt.Errorf("failed to signal callee: %w", err)
	}

	return &StartCallResponse{
		RoomName: roomName,
		Token:    token,
	}, nil
}
