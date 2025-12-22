package main

import (
	"context"
	"log/slog"
	repo "lunar/internal/adapters/postgresql/sqlc"
	"lunar/internal/auth"
	"lunar/internal/chat"
	"lunar/internal/chat/ws"
	"lunar/internal/env"
	"lunar/internal/message"
	"lunar/internal/user"
	"os"
	"reflect"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func main() {
	ctx := context.Background()

	cfg := config{
		addr: env.GetString("APP_ADDR", ":8080"),
		cors: corsConfig{
			allowedOrigins:   []string{"http://localhost:5173", "http://192.168.79.109:5173"},
			allowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
			allowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
			exposedHeaders:   []string{"Link"},
			allowCredentials: true,
			maxAge:           300,
		},
		db:    dbConfig{dsn: env.GetString("POSTGRES_URL", "")},
		redis: redisConfig{addr: env.GetString("REDIS_ADDR", "")},
		auth: authConfig{
			token: tokenConfig{
				access: accessTokenConfig{
					secret: env.GetString("AUTH_TOKEN_SECRET", "secret"),
					exp:    15 * time.Minute,
					iss:    "lunar",
				},
				refresh: refreshTokenConfig{
					exp:           6 * 31 * 24 * time.Hour,
					keyPrefix:     "refresh:",
					userKeyPrefix: "user:",
				},
			},
		},
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	pool, err := pgxpool.New(ctx, cfg.db.dsn)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	rdb := redis.NewClient(&redis.Options{Addr: cfg.redis.addr})

	repos := repo.New(pool)

	authenticator := auth.NewJWTAuthenticator(
		cfg.auth.token.access.secret,
		cfg.auth.token.access.iss,
	)
	refreshService := auth.NewRefreshService(
		rdb,
		cfg.auth.token.refresh.keyPrefix,
		cfg.auth.token.refresh.userKeyPrefix,
		cfg.auth.token.refresh.exp,
	)
	authService := auth.NewService(
		repos,
		pool,
		authenticator,
		refreshService,
		cfg.auth.token.access.exp,
		cfg.auth.token.access.iss,
	)
	userService := user.NewService(repos)
	chatService := chat.NewService(repos)
	wsService := ws.NewService(rdb, repos, cfg.cors.allowedOrigins)
	messageService := message.NewService(repos, pool)

	validate := validator.New()
	validate.RegisterTagNameFunc(func(fld reflect.StructField) string {
		name := strings.SplitN(fld.Tag.Get("json"), ",", 2)[0]

		if name == "-" {
			return ""
		}

		return name
	})

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
		validate:       validate,
	}

	if err := api.run(api.mount()); err != nil {
		slog.Error("server failed to start", "error", err)
		os.Exit(1)
	}
}
