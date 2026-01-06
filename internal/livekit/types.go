package livekit

type TokenResponse struct {
	Token string `json:"token" binding:"required"`
}
