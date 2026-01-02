-- name: CreateMessage :one
INSERT INTO messages(id, room_id, sender_id, content, created_at)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetMessagesPaging :many
SELECT m.*, u.*
FROM messages m
         JOIN users u ON u.id = m.sender_id
WHERE m.room_id = @room_id::uuid
  AND (
      @cursor_created_at::timestamptz IS NULL
      OR
      (m.created_at, m.id) < (@cursor_created_at::timestamptz, @cursor_id::uuid)
      )
ORDER BY m.created_at DESC, m.id DESC
LIMIT @limit_;
