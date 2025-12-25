package redis

import (
	"context"
	"encoding/json"

	"github.com/redis/go-redis/v9"
)

const EmailQueueKey = "queue:emails"

type EmailJob struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

type EmailQueue struct {
	rdb *redis.Client
}

func NewEmailQueue(rdb *redis.Client) *EmailQueue {
	return &EmailQueue{rdb: rdb}
}

func (q *EmailQueue) Enqueue(ctx context.Context, job EmailJob) error {
	data, err := json.Marshal(job)
	if err != nil {
		return err
	}

	return q.rdb.LPush(ctx, EmailQueueKey, data).Err()
}
