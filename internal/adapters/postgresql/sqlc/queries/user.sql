-- name: GetUserByLogin :one
SELECT *
FROM users
WHERE username = @login
   OR email = @login
LIMIT 1
;

-- name: CreateUser :one
INSERT INTO users (username, email, password_hash)
VALUES ($1, $2, $3)
RETURNING users.id;

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

-- name: UpdateUserAvatar :exec
UPDATE users
SET avatar_url = $1
WHERE id = $2;