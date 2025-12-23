package ws

import (
	"net/http"

	"github.com/google/uuid"
)

type Service interface {
	HandleWebSocket(
		w http.ResponseWriter,
		r *http.Request,
		chatID uuid.UUID,
		userID uuid.UUID,
	) error
}
