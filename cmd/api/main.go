package main

import (
	"context"
	"log/slog"
	"lunar/internal/auth"
	"lunar/internal/call"
	"lunar/internal/config"

	"lunar/internal/db/postgres"
	db "lunar/internal/db/postgres/sqlc"
	redis2 "lunar/internal/db/redis"
	"lunar/internal/friendship"
	"lunar/internal/httputil"
	"lunar/internal/livekit"
	"lunar/internal/message"
	"lunar/internal/notification"
	"lunar/internal/room"
	"lunar/internal/user"

	"lunar/internal/ws"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

// @title						Lunar API
// @version					1.0.0
// @securityDefinitions.apikey	BearerAuth
// @in							header
// @name						Authorization
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

	accessCfg := cfg.Auth.AccessToken
	authenticator := auth.NewJWTAuthenticator(accessCfg.Secret, accessCfg.Issuer, accessCfg.TTL)
	refreshCfg := cfg.Auth.RefreshToken
	refreshRepo := redis2.NewRefreshTokenRepository(rdb, refreshCfg.KeyPrefix, refreshCfg.UserKeyPrefix, refreshCfg.TTL)
	userRepo := postgres.NewUserRepository(queries)
	roomRepo := postgres.NewRoomRepository(queries)
	messageRepo := postgres.NewMessageRepository(queries)
	friendshipRepo := postgres.NewFriendshipRepository(pool, queries)

	authService := auth.NewService(
		authenticator,
		refreshRepo,
		userRepo,
		notification.NewLogEmailSender(logger),
		cfg.Features.HasEmailVerification,
	)
	userService := user.NewService(userRepo, authService, cfg.FileStore.AvatarsPath())
	roomService := room.NewService(roomRepo)
	wsService := ws.NewService(rdb, userRepo, messageRepo, cfg.CORS.AllowedOrigins)
	messageService := message.NewService(roomRepo, messageRepo)
	friendshipService := friendship.NewFriendshipService(friendshipRepo, userRepo)
	livekitService := livekit.NewService(cfg.LiveKit.APIKey, cfg.LiveKit.APISecret)
	callService := call.NewService(livekitService, wsService, userRepo)
	validator := httputil.NewValidator()

	api := application{
		config:            cfg,
		db:                pool,
		rdb:               rdb,
		authenticator:     authenticator,
		authService:       authService,
		userService:       userService,
		roomService:       roomService,
		wsService:         wsService,
		messageService:    messageService,
		friendshipService: friendshipService,
		livekitService:    livekitService,
		callService:       callService,
		validator:         validator,
	}

	if err := api.run(api.mount()); err != nil {
		slog.Error("server failed to start", "error", err)
		os.Exit(1)
	}
}
