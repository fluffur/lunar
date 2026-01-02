package ws

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"lunar/internal/model"
	"lunar/internal/repository"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
)

type Service struct {
	rdb         *redis.Client
	upgrader    *websocket.Upgrader
	userRepo    repository.UserRepository
	messageRepo repository.MessageRepository
}

func NewService(rdb *redis.Client, userRepo repository.UserRepository, messageRepo repository.MessageRepository, allowedOrigins []string) *Service {
	return &Service{
		rdb:         rdb,
		userRepo:    userRepo,
		messageRepo: messageRepo,
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
	room model.Room,
	userID uuid.UUID,
) error {
	user, err := s.userRepo.GetByID(r.Context(), userID)
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

	sub := s.rdb.Subscribe(ctx, room.ID.String())
	defer sub.Close()

	inErr := make(chan error, 1)
	outErr := make(chan error, 1)

	go s.handleIncoming(ctx, conn, room.ID, user, inErr)
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
	roomID uuid.UUID,
	user model.User,
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

			message, err := s.processMessage(ctx, roomID, string(msgBytes), user)
			if err != nil {
				slog.Warn("Error creating message", "err", err)
				continue
			}

			payload, err := json.Marshal(message)
			if err != nil {
				slog.Warn("Error marshaling message", "err", err)
				continue
			}

			s.rdb.Publish(ctx, roomID.String(), payload)

		}
	}
}

func (s *Service) processMessage(ctx context.Context, roomID uuid.UUID, content string, sender model.User) (model.Message, error) {
	msg, err := model.NewMessage(roomID, content, sender)
	if err != nil {
		return model.Message{}, err
	}

	createdMessage, err := s.messageRepo.CreateMessage(ctx, msg)
	if err != nil {
		return model.Message{}, err
	}

	return createdMessage, nil

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
