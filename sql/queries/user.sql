-- name: GetUserByLogin :one
SELECT *
FROM users
WHERE username = @login
   OR email = @login
LIMIT 1
;

-- name: CreateUser :one
INSERT INTO users (id, username, email, password_hash, created_at, avatar_url, email_verified)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetUser :one
SELECT *
FROM users
WHERE id = $1
LIMIT 1;

-- name: UserWithUsernameExists :one
SELECT EXISTS (SELECT 1
               FROM users
               WHERE username = $1)
;

-- name: UserWithEmailExists :one
SELECT EXISTS (SELECT 1
               FROM users
               WHERE email = $1)
;

-- name: UpdateUserEmail :exec
UPDATE users
SET email          = $1,
    email_verified = false
WHERE id = $2;

-- name: UpdateUserPassword :exec
UPDATE users
    SET password_hash = $1
WHERE id = $2;

-- name: UpdateUserAvatar :exec
UPDATE users
SET avatar_url = $1
WHERE id = $2;

-- name: MarkEmailVerified :exec
UPDATE users
SET email_verified = true
WHERE id = $1;

-- name: UpsertEmailVerificationCode :exec
INSERT INTO email_verification_codes (user_id, code_hash, pending_email, expires_at, attempts, created_at)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (user_id) DO UPDATE
    SET code_hash     = EXCLUDED.code_hash,
        pending_email = EXCLUDED.pending_email,
        expires_at    = EXCLUDED.expires_at,
        attempts      = EXCLUDED.attempts,
        created_at    = EXCLUDED.created_at;

-- name: GetEmailVerificationCode :one
SELECT *
FROM email_verification_codes
WHERE user_id = $1;

-- name: GetEmailVerificationCodeByEmail :one
SELECT *
FROM email_verification_codes
WHERE pending_email = $1;

-- name: IncrementVerificationAttempts :exec
UPDATE email_verification_codes
SET attempts = attempts + 1
WHERE user_id = $1;