-- name: GetChat :one
SELECT *
FROM chats
WHERE id = $1;

-- name: CreateChat :one
INSERT INTO chats (name, type)
VALUES ($1, $2)
RETURNING chats.id;

-- name: AddUserToChat :exec
INSERT INTO chat_members (chat_id, user_id)
VALUES (@chat_id, @user_id)
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
