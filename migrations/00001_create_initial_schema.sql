-- +goose Up
-- +goose StatementBegin
CREATE TABLE users
(
    id             UUID PRIMARY KEY,
    username       VARCHAR(50)  NOT NULL UNIQUE,
    email          VARCHAR(255) NOT NULL UNIQUE,
    email_verified BOOLEAN      NOT NULL,
    password_hash  VARCHAR(255),
    created_at     TIMESTAMPTZ  NOT NULL
);

CREATE TABLE rooms
(
    id         UUID PRIMARY KEY,
    name       VARCHAR(100),
    slug       VARCHAR(16) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE room_members
(
    id        UUID PRIMARY KEY,
    room_id   UUID        NOT NULL REFERENCES rooms (id) ON DELETE CASCADE,
    user_id   UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL,
    UNIQUE (room_id, user_id)
);


CREATE TABLE messages
(
    id         UUID PRIMARY KEY,
    room_id    UUID        NOT NULL REFERENCES rooms (id) ON DELETE CASCADE,
    sender_id  UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    content    TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_messages_room_created
    ON messages (room_id, created_at DESC, id DESC);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE users;
DROP TABLE rooms;
DROP TABLE room_members;
DROP TABLE messages;
DROP INDEX idx_messages_room_created;
-- +goose StatementEnd
