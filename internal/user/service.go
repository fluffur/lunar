package user

import (
	"context"
	"errors"
	"fmt"
	"image"
	"image/jpeg"
	"log/slog"
	repo "lunar/internal/adapters/postgresql/sqlc"
	"mime/multipart"
	"os"
	"path/filepath"

	"github.com/disintegration/imaging"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"golang.org/x/crypto/bcrypt"
)

type svc struct {
	repo             repo.Querier
	avatarsUploadDir string
}

var (
	ErrEmailAlreadyExists     = errors.New("email already exists")
	ErrInvalidCurrentPassword = errors.New("invalid current password")
	ErrInvalidImage           = errors.New("invalid image")
	ErrUploadAvatar           = errors.New("failed to upload avatar")
)

func NewService(repo repo.Querier, avatarsUploadDir string) Service {
	return &svc{repo, avatarsUploadDir}
}

func (s *svc) GetUser(ctx context.Context, id uuid.UUID) (repo.User, error) {
	return s.repo.GetUser(ctx, id)
}

func (s *svc) UpdateAvatar(ctx context.Context, id uuid.UUID, url string) error {
	return s.repo.UpdateUserAvatar(ctx, repo.UpdateUserAvatarParams{
		ID: id,
		AvatarUrl: pgtype.Text{
			String: url,
			Valid:  true,
		},
	})
}

func (s *svc) UpdateEmail(ctx context.Context, id uuid.UUID, email string) error {
	err := s.repo.UpdateUserEmail(ctx, repo.UpdateUserEmailParams{
		ID:    id,
		Email: email,
	})

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return ErrEmailAlreadyExists
		}
	}

	return err
}

func (s *svc) UpdatePassword(ctx context.Context, id uuid.UUID, currentPassword, newPassword string) error {
	user, err := s.repo.GetUser(ctx, id)
	if err != nil {
		return err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash.String), []byte(currentPassword)); err != nil {
		return ErrInvalidCurrentPassword
	}

	newPasswordHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	return s.repo.UpdateUserPassword(ctx, repo.UpdateUserPasswordParams{
		ID: id,
		PasswordHash: pgtype.Text{
			String: string(newPasswordHash),
			Valid:  true,
		},
	})
}

func (s *svc) UploadAvatar(file multipart.File, filename string) (string, error) {
	img, format, err := image.Decode(file)
	if err != nil {
		return "", err
	}
	if format != "jpg" && format != "jpeg" && format != "png" && format != "webp" {
		return "", ErrInvalidImage
	}
	dstImg := imaging.Fill(img, 128, 128, imaging.Center, imaging.Lanczos)

	resultFilename := fmt.Sprintf("%s.%s", uuid.New().String(), format)
	filePath := filepath.Join(s.avatarsUploadDir, resultFilename)
	out, err := os.Create(filePath)
	if err != nil {
		slog.Error("file upload", "err", err, "dir", s.avatarsUploadDir)
		return "", ErrUploadAvatar
	}
	defer out.Close()

	if err := jpeg.Encode(out, dstImg, &jpeg.Options{Quality: 80}); err != nil {
		return "", err
	}

	return resultFilename, nil
}
