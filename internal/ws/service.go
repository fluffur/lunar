package ws

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"lunar/internal/httputil"
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

	// clients maps userID to their active connection(s)
	// For simplicity, we assume one connection per user for now,
	// or we can just pub/sub to strict redis channels and not keep local state except for the connection loop itself.
	// Actually, standard practice with Redis Pub/Sub: each connection subscribes to necessary channels.
	// We don't need a global map if we rely on Redis for broadcasting.
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

	// 1. Subscribe to User's private channel (for calls, notifications)
	userChannel := fmt.Sprintf("user:%s", userID.String())
	sub := s.rdb.Subscribe(ctx, userChannel)
	defer sub.Close()

	// Channels for managing dynamic subscriptions (joining rooms)
	// Since Redis PubSub is blocking, we need a way to manage multiple subscriptions.
	// However, go-redis PubSub is thread-safe. We can add/remove channels to `sub`.

	inErr := make(chan error, 1)
	outErr := make(chan error, 1)

	// We need a thread-safe map to track active room subscriptions if we want to unsubscribe later
	// But go-redis handles this.

	go s.handleIncoming(ctx, conn, user, sub, inErr)
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
	user model.User,
	sub *redis.PubSub,
	errChan chan error,
) {
	for {
		select {
		case <-ctx.Done():
			return
		default:
			_, msgBytes, err := conn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
					errChan <- fmt.Errorf("websocket closed unexpectedly: %w", err)
				}
				return
			}

			var clientMsg ClientMessage
			if err := json.Unmarshal(msgBytes, &clientMsg); err != nil {
				slog.Warn("Invalid message format", "err", err)
				continue
			}

			if err := s.processClientMessage(ctx, clientMsg, user, sub); err != nil {
				slog.Warn("Error processing message", "type", clientMsg.Type, "err", err)
			}
		}
	}
}

func (s *Service) processClientMessage(ctx context.Context, msg ClientMessage, user model.User, sub *redis.PubSub) error {
	switch msg.Type {
	case MsgJoinRoom:
		var payload JoinRoomPayload
		if err := json.Unmarshal(msg.Payload, &payload); err != nil {
			return err
		}
		// Validate room exists? For now assume yes or client knows what they are doing.
		// Security: Check if user is allowed to join this room?
		// Ideally we should check room membership here.
		// For MVP, we trust the client to only join rooms they have access to (fetched via REST API).
		// But in production you MUST verify.

		roomChannel := payload.RoomID // Assuming RoomID is the channel name (uuid string)
		return sub.Subscribe(ctx, roomChannel)

	case MsgLeaveRoom:
		var payload LeaveRoomPayload
		if err := json.Unmarshal(msg.Payload, &payload); err != nil {
			return err
		}
		roomChannel := payload.RoomID
		return sub.Unsubscribe(ctx, roomChannel)

	case MsgChatMessage:
		var payload ChatMessagePayload
		if err := json.Unmarshal(msg.Payload, &payload); err != nil {
			return err
		}

		roomID, err := uuid.Parse(payload.RoomID)
		if err != nil {
			return fmt.Errorf("invalid room id: %w", err)
		}

		// Save to DB
		message, err := model.NewMessage(roomID, payload.Content, user)
		if err != nil {
			return err
		}

		savedMsg, err := s.messageRepo.CreateMessage(ctx, message)
		if err != nil {
			return err
		}

		// Broadcast to Redis
		response := ServerMessage{
			Type:    MsgNewMessage,
			Payload: savedMsg,
		}

		respBytes, err := json.Marshal(response)
		if err != nil {
			return err
		}

		return s.rdb.Publish(ctx, payload.RoomID, respBytes).Err()

	default:
		return fmt.Errorf("unknown message type: %s", msg.Type)
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

			// msg.Payload is the raw JSON string published to Redis
			// We just forward it to the websocket client
			// But wait, our Redis messages might be just the payload or the full ServerMessage wrapper?
			// In processClientMessage we wrapped it in ServerMessage.
			// So we can send it directly.

			err := conn.WriteMessage(websocket.TextMessage, []byte(msg.Payload))
			if err != nil {
				errChan <- err
				return
			}
		}
	}
}

// PublishUserEvent allows other services to publish events to a specific user
func (s *Service) PublishUserEvent(ctx context.Context, userID uuid.UUID, eventType MessageType, payload interface{}) error {
	msg := ServerMessage{
		Type:    eventType,
		Payload: payload,
	}

	bytes, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	channel := fmt.Sprintf("user:%s", userID.String())
	return s.rdb.Publish(ctx, channel, bytes).Err()
}

func (s *Service) Handle(w http.ResponseWriter, r *http.Request) {
	user := httputil.UserFromRequest(r)
	if err := s.HandleWebSocket(w, r, user.ID); err != nil {
		slog.Error("websocket error", "err", err)
	}
}
