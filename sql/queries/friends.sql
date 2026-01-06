-- name: CreateFriendRequest :exec
INSERT INTO friend_requests (from_user_id, to_user_id, message)
VALUES ($1, $2, $3);

-- name: GetFriendRequest :one
SELECT from_user_id, to_user_id, status, message, created_at, responded_at
FROM friend_requests
WHERE from_user_id = $1 AND to_user_id = $2;

-- name: ListIncomingRequests :many
SELECT from_user_id, to_user_id, status, message, created_at, responded_at
FROM friend_requests
WHERE to_user_id = $1 AND status = 'pending'
ORDER BY created_at DESC;

-- name: ListOutgoingRequests :many
SELECT from_user_id, to_user_id, status, message, created_at, responded_at
FROM friend_requests
WHERE from_user_id = $1 AND status = 'pending'
ORDER BY created_at DESC;

-- name: DeleteFriendRequest :exec
DELETE FROM friend_requests
WHERE from_user_id = $1 AND to_user_id = $2;

-- name: InsertFriendshipEdge :exec
INSERT INTO friendships (user_id, friend_id, created_at)
VALUES ($1, $2, now());

-- name: DeleteFriendshipEdge :exec
DELETE FROM friendships
WHERE user_id = $1 AND friend_id = $2;

-- name: ListFriends :many
SELECT user_id, friend_id, created_at
FROM friendships
WHERE user_id = $1
ORDER BY created_at DESC;

-- name: IsBlocked :one
SELECT EXISTS(
    SELECT 1 FROM user_blocks
    WHERE from_user_id = $1 AND to_user_id = $2
) AS blocked;

-- name: CreateBlock :exec
INSERT INTO user_blocks (from_user_id, to_user_id)
VALUES ($1, $2);

-- name: DeleteBlock :exec
DELETE FROM user_blocks
WHERE from_user_id = $1 AND to_user_id = $2;

-- name: ListBlocked :many
SELECT from_user_id, to_user_id, created_at
FROM user_blocks
WHERE from_user_id = $1
ORDER BY created_at DESC;