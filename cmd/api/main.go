package main

import (
	"context"
	"log/slog"
	"lunar/internal/auth"
	"lunar/internal/chat"
	"lunar/internal/chat/ws"
	"lunar/internal/config"
	redis2 "lunar/internal/db/redis"
	db "lunar/internal/db/sqlc"
	"lunar/internal/httputil"
	"lunar/internal/message"
	"lunar/internal/user"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func main() {
	ctx := context.Background()

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed load config", "error", err)
		os.Exit(1)
	}

	pool, err := pgxpool.New(ctx, cfg.DB.DSN)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	rdb := redis.NewClient(&redis.Options{Addr: cfg.Redis.Addr})

	queries := db.New(pool)

	authenticator := auth.NewJWTAuthenticator(
		cfg.Auth.AccessToken.Secret,
		cfg.Auth.AccessToken.Issuer,
		cfg.Auth.AccessToken.TTL,
	)

	refreshService := redis2.NewRefreshTokenRepository(
		rdb,
		cfg.Auth.RefreshToken.KeyPrefix,
		cfg.Auth.RefreshToken.UserKeyPrefix,
		cfg.Auth.RefreshToken.TTL,
	)
	authService := auth.NewService(
		queries,
		pool,
		authenticator,
		refreshService,
	)
	userService := user.NewService(queries, cfg.FileStore.AvatarsPath())
	chatService := chat.NewService(queries)
	wsService := ws.NewService(rdb, queries, cfg.CORS.AllowedOrigins)
	messageService := message.NewService(queries, pool)

	validator := httputil.NewValidator()

	api := application{
		config:         cfg,
		db:             pool,
		rdb:            rdb,
		authenticator:  authenticator,
		authService:    authService,
		userService:    userService,
		chatService:    chatService,
		wsService:      wsService,
		messageService: messageService,
		validator:      validator,
	}

	if err := api.run(api.mount()); err != nil {
		slog.Error("server failed to start", "error", err)
		os.Exit(1)
	}
}
