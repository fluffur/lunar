package main

import (
	"log/slog"
	"lunar/internal/auth"
	"lunar/internal/chat"
	"lunar/internal/chat/ws"
	"lunar/internal/message"
	"lunar/internal/user"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-playground/validator/v10"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"

	"github.com/rs/cors"
)

func (app *application) mount() http.Handler {
	r := chi.NewRouter()
	c := cors.New(cors.Options{
		AllowedOrigins:   app.config.cors.allowedOrigins,
		AllowedMethods:   app.config.cors.allowedMethods,
		AllowedHeaders:   app.config.cors.allowedHeaders,
		ExposedHeaders:   app.config.cors.exposedHeaders,
		AllowCredentials: app.config.cors.allowCredentials,
		MaxAge:           app.config.cors.maxAge,
	})

	authHandler := auth.NewHandler(app.validate, app.authService)
	userHandler := user.NewHandler(app.validate, app.userService)
	chatHandler := chat.NewHandler(app.validate, app.chatService, app.wsService)
	messageHandler := message.NewHandler(app.validate, app.messageService)

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))
	r.Use(c.Handler)

	authMw := auth.Middleware(app.authenticator, app.userService)
	wsAuthMw := auth.WebSocketMiddleware(app.authenticator, app.userService)
	r.Handle("/uploads/*", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	r.Route("/api", func(r chi.Router) {
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", authHandler.Register)
			r.Post("/login", authHandler.Login)
			r.Post("/refresh", authHandler.Refresh)
			r.Post("/logout", authHandler.Logout)
		})

		r.With(authMw).Group(func(r chi.Router) {
			r.Route("/users/me", func(r chi.Router) {
				r.Get("/", userHandler.CurrentUser)
				r.Post("/avatar", userHandler.UploadAvatar)
			})

			r.Route("/chats", func(r chi.Router) {
				r.Post("/", chatHandler.CreateChat)
				r.Route("/{chatID:[0-9a-fA-F-]{36}}", func(r chi.Router) {
					r.Post("/", chatHandler.JoinCurrentUser)
					r.Get("/messages", messageHandler.ListMessages)
				})
			})
		})

		r.With(wsAuthMw).
			Get("/chats/{chatID:[0-9a-fA-F-]{36}}/ws", chatHandler.Websocket)

	})

	return r
}

func (app *application) run(h http.Handler) error {
	srv := &http.Server{
		Addr:         app.config.addr,
		Handler:      h,
		WriteTimeout: 30 * time.Second,
		ReadTimeout:  10 * time.Second,
		IdleTimeout:  time.Minute,
	}

	slog.Info("server has started", "addr", app.config.addr)

	return srv.ListenAndServe()
}

type application struct {
	config         config
	db             *pgxpool.Pool
	rdb            *redis.Client
	authenticator  auth.Authenticator
	authService    auth.Service
	userService    user.Service
	chatService    chat.Service
	wsService      ws.Service
	messageService message.Service
	validate       *validator.Validate
}

type config struct {
	addr  string
	cors  corsConfig
	db    dbConfig
	redis redisConfig
	auth  authConfig
}

type dbConfig struct {
	dsn string
}

type corsConfig struct {
	allowedOrigins   []string
	allowedMethods   []string
	allowedHeaders   []string
	exposedHeaders   []string
	allowCredentials bool
	maxAge           int
}

type redisConfig struct {
	addr string
}

type authConfig struct {
	token tokenConfig
}

type tokenConfig struct {
	access  accessTokenConfig
	refresh refreshTokenConfig
}

type accessTokenConfig struct {
	secret string
	exp    time.Duration
	iss    string
}

type refreshTokenConfig struct {
	exp           time.Duration
	keyPrefix     string
	userKeyPrefix string
}
