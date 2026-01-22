package livekit

import (
	"encoding/json"
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

func (s *Service) GenerateToken(roomSlug string, userID uuid.UUID, username, avatarUrl string) (string, error) {
	at := auth.NewAccessToken(s.apiKey, s.apiSecret)

	at.AddGrant(&auth.VideoGrant{
		RoomJoin: true,
		Room:     roomSlug,
	})

	at.SetIdentity(userID.String())
	if username != "" {
		at.SetName(username)
	}

	if avatarUrl != "" {
		metadata := map[string]string{
			"avatarUrl": avatarUrl,
		}
		metadataJSON, err := json.Marshal(metadata)
		if err == nil {
			at.SetMetadata(string(metadataJSON))
		}
	}

	at.SetValidFor(time.Hour)

	return at.ToJWT()
}
