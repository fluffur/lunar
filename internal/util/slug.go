package util

import "crypto/rand"

const (
	roomSlugLength = 11
	alphabet       = "abcdefghijklmnopqrstuvwxyz23456789"
)

func GenerateRoomSlug() (string, error) {
	bytes := make([]byte, roomSlugLength)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	for i := range bytes {
		bytes[i] = alphabet[int(bytes[i])%len(alphabet)]
	}
	return string(bytes), nil
}
