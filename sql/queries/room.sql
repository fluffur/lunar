-- name: GetRoom :one
SELECT *
FROM rooms
WHERE id = $1;

-- name: GetUserRooms :many
SELECT r.*,
       COUNT(rm.id)                                         AS member_count,
       COALESCE(json_agg(json_build_object('user_id', u.id, 'username', u.username, 'avatar_url', u.avatar_url))
                FILTER (WHERE u.id IS NOT NULL), '[]'::json)::TEXT AS members
FROM rooms r
         JOIN room_members rm ON rm.room_id = r.id
         JOIN users u ON rm.user_id = u.id
WHERE EXISTS (SELECT 1 FROM room_members rm2 WHERE rm2.room_id = r.id AND rm2.user_id = $1)
GROUP BY r.id;

-- name: CreateRoom :one
INSERT INTO rooms (id, name, slug, created_at)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: AddRoomMember :exec
INSERT INTO room_members (id, room_id, user_id, joined_at)
VALUES ($1, $2, $3, $4)
ON CONFLICT (room_id, user_id) DO NOTHING;
;

-- name: RoomExists :one
SELECT EXISTS (SELECT 1
               FROM rooms
               WHERE id = $1);


-- name: IsUserRoomMember :one
SELECT EXISTS (SELECT 1
               FROM room_members
               WHERE room_id = $1
                 AND user_id = $2);

-- name: GetRoomBySlug :one
SELECT *
FROM rooms
WHERE slug = $1
LIMIT 1;