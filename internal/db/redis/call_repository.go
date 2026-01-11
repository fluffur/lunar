package redis

import (
	"context"
	"fmt"
	"lunar/internal/repository"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type CallRepository struct {
	rdb *redis.Client
}

func NewCallRepository(rdb *redis.Client) repository.CallRepository {
	return &CallRepository{
		rdb: rdb,
	}
}

func activeCallKey(userID uuid.UUID) string {
	return fmt.Sprintf("user_active_calls:%s", userID.String())
}

func (r *CallRepository) SaveActiveCall(ctx context.Context, userID uuid.UUID, roomName string, callerID uuid.UUID, callerName string) error {
	key := activeCallKey(userID)

	values := map[string]interface{}{
		"room_name":   roomName,
		"caller_id":   callerID.String(),
		"caller_name": callerName,
		"created_at":  time.Now().Unix(),
	}

	pipeline := r.rdb.Pipeline()
	pipeline.HSet(ctx, key, values)
	pipeline.Expire(ctx, key, 10*time.Minute) // Call invalid after 10 mins

	_, err := pipeline.Exec(ctx)
	return err
}

func (r *CallRepository) GetActiveCall(ctx context.Context, userID uuid.UUID) (roomName string, callerID uuid.UUID, callerName string, exists bool, err error) {
	key := activeCallKey(userID)

	res, err := r.rdb.HGetAll(ctx, key).Result()
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

func (r *CallRepository) RemoveActiveCall(ctx context.Context, userID uuid.UUID) error {
	key := activeCallKey(userID)
	return r.rdb.Del(ctx, key).Err()
}
