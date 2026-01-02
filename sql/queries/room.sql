-- name: GetRoom :one
SELECT *
FROM rooms
WHERE id = $1;

-- name: GetUserRooms :many
SELECT r.*
FROM rooms r
         JOIN room_members rm ON rm.room_id = r.id
WHERE rm.user_id = $1;

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
