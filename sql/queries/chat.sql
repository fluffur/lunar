-- name: GetChat :one
SELECT *
FROM chats
WHERE id = $1;

-- name: CreateChat :one
INSERT INTO chats (id, name, type, created_at)
VALUES ($1, $2, $3, $4)
RETURNING chats.id;

-- name: AddUserToChat :exec
INSERT INTO chat_members (id, chat_id, user_id, joined_at)
VALUES ($1, $2, $3, $4)
ON CONFLICT (chat_id, user_id) DO NOTHING;
;

-- name: ChatExists :one
SELECT EXISTS (SELECT 1
               FROM chats
               WHERE id = @chat_id);


-- name: IsUserChatMember :one
SELECT EXISTS (SELECT 1
               FROM chat_members
               WHERE chat_id = @chat_id
                 AND user_id = @user_id) AS is_member;
