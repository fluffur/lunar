package call

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type Store struct {
	rdb *redis.Client
}

func NewStore(rdb *redis.Client) *Store {
	return &Store{
		rdb: rdb,
	}
}

func activeCallKey(userID uuid.UUID) string {
	return fmt.Sprintf("user_active_calls:%s", userID.String())
}

func (s *Store) SaveActiveCall(ctx context.Context, userID uuid.UUID, roomName string, callerID uuid.UUID, callerName string) error {
	key := activeCallKey(userID)

	values := map[string]interface{}{
		"room_name":   roomName,
		"caller_id":   callerID.String(),
		"caller_name": callerName,
		"created_at":  time.Now().Unix(),
	}

	pipeline := s.rdb.Pipeline()
	pipeline.HSet(ctx, key, values)
	pipeline.Expire(ctx, key, 10*time.Minute) // Call invalid after 10 mins

	_, err := pipeline.Exec(ctx)
	return err
}

func (s *Store) GetActiveCall(ctx context.Context, userID uuid.UUID) (roomName string, callerID uuid.UUID, callerName string, exists bool, err error) {
	key := activeCallKey(userID)

	res, err := s.rdb.HGetAll(ctx, key).Result()
	if err != nil {
		return "", uuid.Nil, "", false, err
	}

	if len(res) == 0 {
		return "", uuid.Nil, "", false, nil
	}

	roomName = res["room_name"]
	callerName = res["caller_name"]
	cidVal := res["caller_id"]

	if cidVal != "" {
		callerID, err = uuid.Parse(cidVal)
		if err != nil {
			// Data corruption or invalid UUID, treat as no call
			return "", uuid.Nil, "", false, nil
		}
	}

	return roomName, callerID, callerName, true, nil
}

func (s *Store) RemoveActiveCall(ctx context.Context, userID uuid.UUID) error {
	key := activeCallKey(userID)
	return s.rdb.Del(ctx, key).Err()
}
