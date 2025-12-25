package user

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"image"
	"image/jpeg"
	"log/slog"
	"lunar/internal/db/redis"
	"lunar/internal/db/sqlc"
	"math/big"
	"mime/multipart"
	"os"
	"path/filepath"
	"time"

	"github.com/disintegration/imaging"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	q                sqlc.Querier
	avatarsUploadDir string
	emailQueue       *redis.EmailQueue
}

func NewService(q sqlc.Querier, avatarsUploadDir string) *Service {
	return &Service{
		q:                q,
		avatarsUploadDir: avatarsUploadDir,
	}
}

func (s *Service) GetUser(ctx context.Context, id uuid.UUID) (sqlc.User, error) {
	return s.q.GetUser(ctx, id)
}

func (s *Service) UpdateAvatar(ctx context.Context, id uuid.UUID, url string) error {
	return s.q.UpdateUserAvatar(ctx, sqlc.UpdateUserAvatarParams{
		ID: id,
		AvatarUrl: pgtype.Text{
			String: url,
			Valid:  true,
		},
	})
}

func (s *Service) UpdateEmail(ctx context.Context, id uuid.UUID, email string) error {
	err := s.q.UpdateUserEmail(ctx, sqlc.UpdateUserEmailParams{
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

func (s *Service) UpdatePassword(ctx context.Context, id uuid.UUID, currentPassword, newPassword string) error {
	user, err := s.q.GetUser(ctx, id)
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

	return s.q.UpdateUserPassword(ctx, sqlc.UpdateUserPasswordParams{
		ID: id,
		PasswordHash: pgtype.Text{
			String: string(newPasswordHash),
			Valid:  true,
		},
	})
}

func (s *Service) UploadAvatar(file multipart.File) (string, error) {
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

func (s *Service) SendVerificationCode(ctx context.Context, id uuid.UUID) error {
	user, err := s.q.GetUser(ctx, id)
	if err != nil {
		return err
	}

	n, err := rand.Int(rand.Reader, big.NewInt(1_000_000))
	if err != nil {
		return err
	}

	code := fmt.Sprintf("%06d", n)
	codeHash, err := bcrypt.GenerateFromPassword([]byte(code), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	if err := s.q.UpsertEmailVerificationCode(ctx, sqlc.UpsertEmailVerificationCodeParams{
		UserID:   id,
		CodeHash: string(codeHash),
		ExpiresAt: pgtype.Timestamptz{
			Time:  time.Now().Add(time.Minute * 15),
			Valid: true,
		},
	}); err != nil {
		return err
	}

	return s.emailQueue.Enqueue(ctx, redis.EmailJob{
		To:      user.Email,
		Subject: "Verification Code",
		Body:    code,
	})

}
