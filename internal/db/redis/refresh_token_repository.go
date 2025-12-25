package redis

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"lunar/internal/auth"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

var (
	ErrInvalidRefreshToken = errors.New("invalid refresh token")
)

type RefreshTokenRepository struct {
	rdb           *redis.Client
	keyPrefix     string
	userKeyPrefix string
	ttl           time.Duration
}

func NewRefreshTokenRepository(rdb *redis.Client, keyPrefix string, userKeyPrefix string, ttl time.Duration) auth.RefreshTokenRepository {
	return &RefreshTokenRepository{
		rdb:           rdb,
		keyPrefix:     keyPrefix,
		userKeyPrefix: userKeyPrefix,
		ttl:           ttl,
	}
}

func (s *RefreshTokenRepository) Issue(ctx context.Context, userID uuid.UUID) (string, error) {
	token, err := generateToken()
	if err != nil {
		return "", err
	}

	hash := hashToken(token)

	pipe := s.rdb.TxPipeline()

	pipe.Set(ctx, s.keyPrefix+hash, userID.String(), s.ttl)
	pipe.SAdd(ctx, s.userKey(userID), hash)
	pipe.Expire(ctx, s.userKey(userID), s.ttl)

	if _, err := pipe.Exec(ctx); err != nil {
		return "", err
	}

	return token, nil
}

func (s *RefreshTokenRepository) Consume(ctx context.Context, token string) (uuid.UUID, error) {
	hash := hashToken(token)
	key := s.keyPrefix + hash

	userIDString, err := s.rdb.GetDel(ctx, key).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return uuid.Nil, ErrInvalidRefreshToken
		}
		return uuid.Nil, err
	}

	userID, err := uuid.Parse(userIDString)
	if err != nil {
		return uuid.Nil, err
	}

	s.rdb.SRem(ctx, s.userKey(userID), hash)

	return userID, nil
}

func (s *RefreshTokenRepository) Revoke(ctx context.Context, token string) error {
	_, err := s.Consume(ctx, token)
	if errors.Is(err, ErrInvalidRefreshToken) {
		return nil
	}
	return err
}

func (s *RefreshTokenRepository) RevokeAll(ctx context.Context, userID uuid.UUID) error {
	hashes, err := s.rdb.SMembers(ctx, s.userKey(userID)).Result()
	if err != nil {
		return err
	}

	if len(hashes) == 0 {
		return nil
	}

	keys := make([]string, 0, len(hashes))
	for _, h := range hashes {
		keys = append(keys, s.keyPrefix+h)
	}

	pipe := s.rdb.TxPipeline()
	pipe.Del(ctx, keys...)
	pipe.Del(ctx, s.userKey(userID))

	_, err = pipe.Exec(ctx)
	return err
}

func (s *RefreshTokenRepository) userKey(userID uuid.UUID) string {
	return s.keyPrefix + s.userKeyPrefix + userID.String()
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func generateToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}
