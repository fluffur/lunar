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

-- name: ListIncomingRequestsWithUsers :many
SELECT 
    fr.from_user_id,
    fr.to_user_id,
    fr.status,
    fr.message,
    fr.created_at,
    fr.responded_at,
    u.id as from_user_id,
    u.username as from_username,
    u.avatar_url as from_avatar_url
FROM friend_requests fr
INNER JOIN users u ON u.id = fr.from_user_id
WHERE fr.to_user_id = $1 AND fr.status = 'pending'
ORDER BY fr.created_at DESC;

-- name: ListOutgoingRequestsWithUsers :many
SELECT 
    fr.from_user_id,
    fr.to_user_id,
    fr.status,
    fr.message,
    fr.created_at,
    fr.responded_at,
    u.id as to_user_id,
    u.username as to_username,
    u.avatar_url as to_avatar_url
FROM friend_requests fr
INNER JOIN users u ON u.id = fr.to_user_id
WHERE fr.from_user_id = $1 AND fr.status = 'pending'
ORDER BY fr.created_at DESC;

-- name: ListFriendsWithUsers :many
SELECT 
    f.user_id,
    f.friend_id,
    f.created_at,
    u.id as friend_user_id,
    u.username as friend_username,
    u.avatar_url as friend_avatar_url
FROM friendships f
INNER JOIN users u ON u.id = f.friend_id
WHERE f.user_id = $1
ORDER BY f.created_at DESC;