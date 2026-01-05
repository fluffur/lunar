package postgres

import (
	"context"
	"errors"
	db "lunar/internal/db/postgres/sqlc"
	"lunar/internal/model"
	"lunar/internal/repository"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
)

type UserRepository struct {
	queries db.Querier
}

func NewUserRepository(queries db.Querier) repository.UserRepository {
	return &UserRepository{queries}
}

func mapUser(user db.User) model.User {
	return model.User{
		ID:            user.ID,
		Username:      user.Username,
		PasswordHash:  user.PasswordHash.String,
		Email:         user.Email,
		AvatarURL:     user.AvatarUrl.String,
		EmailVerified: user.EmailVerified,
	}
}

//func (r *UserRepository) RunInTx(ctx context.Context, fn func(repository repository.UserRepository) error) error {
//	tx, err := r.db.Begin(ctx)
//	if err != nil {
//		return err
//	}
//	defer tx.Rollback(ctx)
//
//	if err := fn(r.withTx(tx)); err != nil {
//		return err
//	}
//
//	return tx.Commit(ctx)
//}
//
//func (r *UserRepository) withTx(tx pgx.Tx) repository.UserRepository {
//	return NewUserRepository(r.queries.WithTx(tx))
//}

func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (model.User, error) {
	u, err := r.queries.GetUser(ctx, id)
	if err != nil {
		return model.User{}, err
	}

	return mapUser(u), nil
}

func (r *UserRepository) GetByLogin(ctx context.Context, login string) (model.User, error) {
	u, err := r.queries.GetUserByLogin(ctx, login)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.User{}, repository.ErrUserNotFound
		}

		return model.User{}, err
	}

	return mapUser(u), nil
}

func (r *UserRepository) CheckUsernameExists(ctx context.Context, username string) (bool, error) {
	return r.queries.UserWithUsernameExists(ctx, username)
}

func (r *UserRepository) CheckEmailExists(ctx context.Context, email string) (bool, error) {
	return r.queries.UserWithEmailExists(ctx, email)
}

func (r *UserRepository) Create(ctx context.Context, u model.User) (model.User, error) {
	createdUser, err := r.queries.CreateUser(ctx, db.CreateUserParams{
		ID:            u.ID,
		Username:      u.Username,
		Email:         u.Email,
		PasswordHash:  textFromString(u.PasswordHash),
		CreatedAt:     timestampFromTime(u.CreatedAt),
		AvatarUrl:     textFromString(u.AvatarURL),
		EmailVerified: u.EmailVerified,
	})
	if err != nil {
		return model.User{}, err
	}

	return mapUser(createdUser), nil
}

func (r *UserRepository) ChangeAvatar(ctx context.Context, id uuid.UUID, url string) error {
	return r.queries.UpdateUserAvatar(ctx, db.UpdateUserAvatarParams{
		AvatarUrl: pgtype.Text{
			String: url,
			Valid:  true,
		},
		ID: id,
	})
}

func (r *UserRepository) UpdatePassword(ctx context.Context, id uuid.UUID, newPasswordHash string) error {
	return r.queries.UpdateUserPassword(ctx, db.UpdateUserPasswordParams{
		ID: id,
		PasswordHash: pgtype.Text{
			String: newPasswordHash,
			Valid:  true,
		},
	})
}

func (r *UserRepository) UpdateEmail(ctx context.Context, id uuid.UUID, email string) error {

	err := r.queries.UpdateUserEmail(ctx, db.UpdateUserEmailParams{
		ID:    id,
		Email: email,
	})

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return repository.ErrUniqueAlreadyExists
		}
	}

	return err

}

func (r *UserRepository) MarkEmailVerified(ctx context.Context, userID uuid.UUID) error {
	return r.queries.MarkEmailVerified(ctx, userID)
}

func (r *UserRepository) SaveVerificationCode(ctx context.Context, userID uuid.UUID, email, codeHash string, duration string) error {
	dur, err := time.ParseDuration(duration)
	if err != nil {
		return err
	}
	return r.queries.UpsertEmailVerificationCode(ctx, db.UpsertEmailVerificationCodeParams{
		UserID:       userID,
		CodeHash:     codeHash,
		PendingEmail: textFromString(email),
		ExpiresAt:    timestampFromTime(time.Now().Add(dur)),
		Attempts:     0,
		CreatedAt:    timestampFromTime(time.Now()),
	})
}

func mapVerificationCode(code db.EmailVerificationCode) model.EmailVerificationCode {
	return model.EmailVerificationCode{
		UserID:       code.UserID,
		CodeHash:     code.CodeHash,
		PendingEmail: code.PendingEmail.String,
		ExpiresAt:    code.ExpiresAt.Time,
		Attempts:     int(code.Attempts),
		CreatedAt:    code.CreatedAt.Time,
	}
}

func (r *UserRepository) GetVerificationCode(ctx context.Context, userID uuid.UUID) (model.EmailVerificationCode, error) {
	code, err := r.queries.GetEmailVerificationCode(ctx, userID)
	if err != nil {
		return model.EmailVerificationCode{}, err
	}
	return mapVerificationCode(code), nil
}

func (r *UserRepository) GetVerificationCodeByEmail(ctx context.Context, email string) (model.EmailVerificationCode, error) {
	code, err := r.queries.GetEmailVerificationCodeByEmail(ctx, pgtype.Text{String: email, Valid: true})
	if err != nil {
		return model.EmailVerificationCode{}, err
	}
	return mapVerificationCode(code), nil
}

func (r *UserRepository) IncrementVerificationAttempts(ctx context.Context, userID uuid.UUID) error {
	return r.queries.IncrementVerificationAttempts(ctx, userID)
}
