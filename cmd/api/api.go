package main

import (
	"fmt"
	"log/slog"
	"lunar/internal/auth"
	"lunar/internal/chat"
	"lunar/internal/config"
	"lunar/internal/httputil"
	"lunar/internal/message"
	"lunar/internal/user"
	"lunar/internal/ws"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func (app *application) mount() http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   app.config.CORS.AllowedOrigins,
		AllowedMethods:   app.config.CORS.AllowedMethods,
		AllowedHeaders:   app.config.CORS.AllowedHeaders,
		ExposedHeaders:   app.config.CORS.ExposedHeaders,
		AllowCredentials: app.config.CORS.AllowCredentials,
		MaxAge:           app.config.CORS.MaxAge,
	}))

	authMw := auth.Middleware(app.authenticator)
	wsAuthMw := auth.WebSocketMiddleware(app.authenticator)

	authHandler := auth.NewHandler(app.validator, app.authService)
	userHandler := user.NewHandler(app.validator, app.userService)
	chatHandler := chat.NewHandler(app.validator, app.chatService, app.wsService)
	messageHandler := message.NewHandler(app.validator, app.messageService)

	r.Mount("/api", r)
	r.Handle("/uploads/*", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	r.Route("/auth", func(r chi.Router) {
		r.Post("/register", authHandler.Register)
		r.Post("/login", authHandler.Login)

		r.Post("/refresh", authHandler.Refresh)
		r.Post("/logout", authHandler.Logout)
	})

	r.With(authMw).Group(func(r chi.Router) {
		r.Route("/users/me", func(r chi.Router) {
			r.Get("/", userHandler.CurrentUser)
			r.Post("/email", userHandler.UpdateEmail)
			r.Post("/email/verification-code", userHandler.SendVerificationCode)
			r.Post("/email/verify", userHandler.VerifyEmail)
			r.Post("/password", userHandler.ChangePassword)
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

	return r
}

func (app *application) run(h http.Handler) error {
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", app.config.Addr),
		Handler:      h,
		WriteTimeout: 30 * time.Second,
		ReadTimeout:  10 * time.Second,
		IdleTimeout:  time.Minute,
	}

	slog.Info("server has started", "addr", app.config.Addr)

	return srv.ListenAndServe()
}

type application struct {
	config         *config.Config
	db             *pgxpool.Pool
	rdb            *redis.Client
	authenticator  *auth.Authenticator
	authService    *auth.Service
	userService    *user.Service
	chatService    *chat.Service
	wsService      *ws.Service
	messageService *message.Service
	validator      *httputil.Validator
}
