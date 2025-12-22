package ws

import (
	repo "lunar/internal/adapters/postgresql/sqlc"
	"net/http"

	"github.com/google/uuid"
)

type Service interface {
	HandleWebSocket(
		w http.ResponseWriter,
		r *http.Request,
		chatID uuid.UUID,
		user repo.User,
	) error
}
