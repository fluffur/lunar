package user

import (
	"context"
	"errors"
	"fmt"
	"image"
	"image/jpeg"
	"log/slog"
	"lunar/internal/model"
	"lunar/internal/repository"
	"mime/multipart"
	"os"
	"path/filepath"

	"github.com/disintegration/imaging"
	"github.com/google/uuid"
)

type Service struct {
	repo             repository.UserRepository
	avatarsUploadDir string
}

func NewService(repo repository.UserRepository, avatarsUploadDir string) *Service {
	return &Service{
		repo,
		avatarsUploadDir,
	}
}

func (s *Service) GetUser(ctx context.Context, id uuid.UUID) (model.User, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) UpdateAvatar(ctx context.Context, id uuid.UUID, url string) error {
	return s.repo.ChangeAvatar(ctx, id, url)
}

func (s *Service) UpdateEmail(ctx context.Context, id uuid.UUID, email string) error {
	if err := s.repo.UpdateEmail(ctx, id, email); err != nil {
		if errors.Is(err, repository.ErrUniqueAlreadyExists) {
			return ErrEmailAlreadyExists
		}
		return err
	}
	return nil
}

func (s *Service) UpdatePassword(ctx context.Context, id uuid.UUID, currentPassword, newPassword string) error {
	user, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	if err := user.ComparePasswords(currentPassword); err != nil {
		return ErrInvalidCurrentPassword
	}

	if err := user.ChangePassword(newPassword); err != nil {
		return err
	}

	return s.repo.UpdatePassword(ctx, user.ID, user.PasswordHash)
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
