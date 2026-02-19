-- name: CreateServer :one
INSERT INTO servers (id, name, owner_id, avatar_url, created_at)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetServerByID :one
SELECT * FROM servers WHERE id = $1;

-- name: DeleteServer :exec
DELETE FROM servers WHERE id = $1;

-- name: AddServerMember :exec
INSERT INTO server_members (id, server_id, user_id, nickname, joined_at)
VALUES ($1, $2, $3, $4, $5);

-- name: RemoveServerMember :exec
DELETE FROM server_members WHERE server_id = $1 AND user_id = $2;

-- name: GetServerMember :one
SELECT sm.*, u.username, u.email, u.email_verified, u.avatar_url as user_avatar_url
FROM server_members sm
JOIN users u ON sm.user_id = u.id
WHERE sm.server_id = $1 AND sm.user_id = $2;

-- name: ListServerMembers :many
SELECT sm.*, u.username, u.avatar_url as user_avatar_url
FROM server_members sm
JOIN users u ON sm.user_id = u.id
WHERE sm.server_id = $1
ORDER BY sm.joined_at ASC;

-- name: UpdateServerMemberNickname :exec
UPDATE server_members SET nickname = $3 WHERE server_id = $1 AND user_id = $2;

-- name: CreateServerRole :one
INSERT INTO server_roles (id, server_id, name, color, permissions, position, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: UpdateServerRole :one
UPDATE server_roles
SET name = $3, color = $4, permissions = $5, position = $6
WHERE id = $1 AND server_id = $2
RETURNING *;

-- name: DeleteServerRole :exec
DELETE FROM server_roles WHERE id = $1 AND server_id = $2;

-- name: AssignRoleToMember :exec
INSERT INTO member_roles (member_id, role_id)
VALUES ($1, $2);

-- name: RemoveRoleFromMember :exec
DELETE FROM member_roles WHERE member_id = $1 AND role_id = $2;

-- name: ListServerRoles :many
SELECT * FROM server_roles WHERE server_id = $1 ORDER BY position ASC;

-- name: GetMemberRoles :many
SELECT role_id FROM member_roles WHERE member_id = $1;

-- name: CreateChannel :one
INSERT INTO rooms (id, name, slug, server_id, type, position, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: ListServerChannels :many
SELECT * FROM rooms WHERE server_id = $1 ORDER BY position ASC, created_at ASC;
