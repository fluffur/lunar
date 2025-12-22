-- name: CreateMessage :one
INSERT INTO messages(chat_id, sender_id, content)
VALUES (@chat_id, @sender_id, @content)
RETURNING *;

-- name: GetMessagesPaging :many
SELECT m.*, u.*
FROM messages m
         JOIN users u ON u.id = m.sender_id
WHERE m.chat_id = @chat_id::uuid
  AND (
      @cursor_created_at::timestamptz IS NULL
      OR
      (m.created_at, m.id) < (@cursor_created_at::timestamptz, @cursor_id::uuid)
      )
ORDER BY m.created_at DESC, m.id DESC
LIMIT @limit_;
