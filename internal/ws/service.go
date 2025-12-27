package ws

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	db "lunar/internal/db/sqlc"
	"lunar/internal/model"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
)

type Service struct {
	rdb      *redis.Client
	queries  db.Querier
	upgrader *websocket.Upgrader
}

func NewService(rdb *redis.Client, queries db.Querier, allowedOrigins []string) *Service {
	return &Service{
		rdb:     rdb,
		queries: queries,
		upgrader: &websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				origin := r.Header.Get("Origin")

				for _, allowedOrigin := range allowedOrigins {
					if origin == allowedOrigin {
						return true
					}
				}
				return false
			},
		},
	}
}

func (s *Service) HandleWebSocket(
	w http.ResponseWriter,
	r *http.Request,
	chatID uuid.UUID,
	userID uuid.UUID,
) error {
	user, err := s.queries.GetUser(r.Context(), userID)
	if err != nil {
		return err
	}

	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		return err
	}
	defer conn.Close()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sub := s.rdb.Subscribe(ctx, chatID.String())
	defer sub.Close()

	inErr := make(chan error, 1)
	outErr := make(chan error, 1)

	go s.handleIncoming(ctx, conn, chatID, user, inErr)
	go s.handleOutgoing(ctx, conn, sub.Channel(), outErr)

	select {
	case err := <-inErr:
		return err
	case err := <-outErr:
		return err
	case <-ctx.Done():
		return ctx.Err()
	}

}

func (s *Service) handleIncoming(
	ctx context.Context,
	conn *websocket.Conn,
	chatID uuid.UUID,
	user db.User,
	errChan chan error,
) {
	for {
		select {
		case <-ctx.Done():
			return
		default:
			msgType, msgBytes, err := conn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway) {
					errChan <- fmt.Errorf("websocket closed unexpectedly: %w", err)
				}
				return
			}
			if msgType != websocket.TextMessage {
				continue
			}
			content := string(msgBytes)
			if len(content) == 0 || len(content) > 5000 {
				slog.Warn("Invalid content length")
				continue
			}

			createdMessage, err := s.queries.CreateMessage(ctx, db.CreateMessageParams{
				ChatID:   chatID,
				Content:  content,
				SenderID: user.ID,
			})
			if err != nil {
				slog.Warn("failed to create chat message:", "err", err)
				continue
			}

			msg := model.MessageFromRepo(createdMessage, user)
			payload, _ := json.Marshal(msg)
			s.rdb.Publish(ctx, chatID.String(), payload)

		}
	}
}

func (s *Service) handleOutgoing(
	ctx context.Context,
	conn *websocket.Conn,
	ch <-chan *redis.Message,
	errChan chan error,
) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			err := conn.WriteMessage(websocket.PingMessage, nil)
			if err != nil {
				errChan <- err
				return
			}
		case msg, ok := <-ch:
			if !ok {
				errChan <- fmt.Errorf("redis channel closed")
				return
			}
			err := conn.WriteMessage(websocket.TextMessage, []byte(msg.Payload))
			if err != nil {
				errChan <- err
				return
			}
		}
	}
}
