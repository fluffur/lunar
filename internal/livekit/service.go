package livekit

import (
	"time"

	"github.com/google/uuid"
	"github.com/livekit/protocol/auth"
)

type Service struct {
	apiKey    string
	apiSecret string
}

func NewService(apiKey, apiSecret string) *Service {
	return &Service{apiKey, apiSecret}
}

func (s *Service) GenerateToken(roomSlug string, userID uuid.UUID) (string, error) {
	at := auth.NewAccessToken(s.apiKey, s.apiSecret)

	at.AddGrant(&auth.VideoGrant{
		RoomJoin: true,
		Room:     roomSlug,
	})

	at.SetIdentity(userID.String())
	at.SetValidFor(time.Hour)

	return at.ToJWT()
}
