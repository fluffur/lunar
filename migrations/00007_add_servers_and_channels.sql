-- +goose Up
-- +goose StatementBegin

-- Create servers table
CREATE TABLE servers
(
    id         UUID PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    owner_id   UUID         NOT NULL REFERENCES users (id),
    avatar_url VARCHAR(255),
    created_at TIMESTAMPTZ  NOT NULL
);

-- Create server_members table
CREATE TABLE server_members
(
    id         UUID PRIMARY KEY,
    server_id  UUID        NOT NULL REFERENCES servers (id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    nickname   VARCHAR(50),
    joined_at  TIMESTAMPTZ NOT NULL,
    UNIQUE (server_id, user_id)
);

-- Create server_roles table
CREATE TABLE server_roles
(
    id          UUID PRIMARY KEY,
    server_id   UUID        NOT NULL REFERENCES servers (id) ON DELETE CASCADE,
    name        VARCHAR(50) NOT NULL,
    color       VARCHAR(7), -- Hex color code
    permissions BIGINT      NOT NULL DEFAULT 0,
    position    INT         NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL
);

-- Create member_roles table
CREATE TABLE member_roles
(
    member_id UUID NOT NULL REFERENCES server_members (id) ON DELETE CASCADE,
    role_id   UUID NOT NULL REFERENCES server_roles (id) ON DELETE CASCADE,
    PRIMARY KEY (member_id, role_id)
);

-- Modify rooms table to support channels
ALTER TABLE rooms ADD COLUMN server_id UUID REFERENCES servers (id) ON DELETE CASCADE;
ALTER TABLE rooms ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'dm'; -- 'dm', 'text', 'voice'
ALTER TABLE rooms ADD COLUMN position INT NOT NULL DEFAULT 0;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE rooms DROP COLUMN position;
ALTER TABLE rooms DROP COLUMN type;
ALTER TABLE rooms DROP COLUMN server_id;

DROP TABLE member_roles;
DROP TABLE server_roles;
DROP TABLE server_members;
DROP TABLE servers;
-- +goose StatementEnd
