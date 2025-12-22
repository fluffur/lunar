package user

import (
	"context"
	"fmt"
	"image"
	"image/jpeg"
	repo "lunar/internal/adapters/postgresql/sqlc"
	"mime/multipart"
	"os"
	"path/filepath"

	"github.com/disintegration/imaging"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type svc struct {
	repo repo.Querier
}

func NewService(repo repo.Querier) Service {
	return &svc{repo}
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

func (s *svc) UploadAvatar(ctx context.Context, userID uuid.UUID, file multipart.File, filename string) (string, error) {
	img, _, err := image.Decode(file)
	if err != nil {
		return "", fmt.Errorf("invalid image: %w", err)
	}
	dstImg := imaging.Fill(img, 128, 128, imaging.Center, imaging.Lanczos)

	uploadDir := "./uploads/avatars"

	ext := filepath.Ext(filename)
	if ext == "" {
		ext = ".jpg"
	}
	fileName := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	filePath := filepath.Join(uploadDir, fileName)

	out, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to save file: %w", err)
	}
	defer out.Close()

	if err := jpeg.Encode(out, dstImg, &jpeg.Options{Quality: 80}); err != nil {
		return "", fmt.Errorf("failed to encode image: %w", err)
	}

	if err := s.repo.UpdateUserAvatar(ctx, repo.UpdateUserAvatarParams{
		ID: userID,
		AvatarUrl: pgtype.Text{
			String: fileName,
			Valid:  true,
		},
	}); err != nil {
		return "", fmt.Errorf("failed to update avatar", err)
	}

	return fileName, nil
}
