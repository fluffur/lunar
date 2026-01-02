package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	_ "lunar/docs"
	"lunar/internal/auth"
	"lunar/internal/config"
	"lunar/internal/httputil"
	"lunar/internal/message"
	"lunar/internal/room"
	"lunar/internal/user"
	"lunar/internal/ws"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	httpSwagger "github.com/swaggo/http-swagger"
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

	r.Get("/docs/*", httpSwagger.Handler())

	authMw := auth.Middleware(app.authenticator)
	wsAuthMw := auth.WebSocketMiddleware(app.authenticator)

	authHandler := auth.NewHandler(app.validator, app.authService)
	userHandler := user.NewHandler(app.validator, app.userService)
	roomHandler := room.NewHandler(app.validator, app.roomService, app.wsService)
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

			r.Put("/email", userHandler.UpdateEmail)

			r.Put("/password", userHandler.ChangePassword)
			r.Post("/avatar", userHandler.UploadAvatar)
		})

		r.Route("/rooms", func(r chi.Router) {
			r.Get("/", roomHandler.ListChats)
			r.Post("/", roomHandler.CreateChat)
			r.Route("/{roomID:[0-9a-fA-F-]{36}}", func(r chi.Router) {
				r.Post("/", roomHandler.JoinCurrentUser)
				r.Get("/messages", messageHandler.ListMessages)
			})
		})
	})

	r.With(wsAuthMw).
		Get("/rooms/{roomID:[0-9a-fA-F-]{36}}/ws", roomHandler.Websocket)

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

	shutdown := make(chan error)

	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		s := <-quit

		slog.Info("shutting down server", "signal", s.String())

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		shutdown <- srv.Shutdown(ctx)
	}()

	slog.Info("server has started", "addr", app.config.Addr)

	err := srv.ListenAndServe()
	if !errors.Is(err, http.ErrServerClosed) {
		return err
	}

	err = <-shutdown
	if err != nil {
		return err
	}

	slog.Info("completing background tasks", "addr", srv.Addr)

	app.db.Close()
	if err := app.rdb.Close(); err != nil {
		slog.Error("failed to close redis", "error", err)
	}

	slog.Info("server stopped", "addr", srv.Addr)

	return nil
}

type application struct {
	config         *config.Config
	db             *pgxpool.Pool
	rdb            *redis.Client
	authenticator  *auth.Authenticator
	authService    *auth.Service
	userService    *user.Service
	roomService    *room.Service
	wsService      *ws.Service
	messageService *message.Service
	validator      *httputil.Validator
}
