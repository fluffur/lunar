-- +goose Up
-- +goose StatementBegin
CREATE TABLE users
(
    id            UUID PRIMARY KEY      DEFAULT gen_random_uuid(),
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE chats
(
    id         UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    name       VARCHAR(100),
    type       VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE chat_members
(
    id        UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    chat_id   UUID        NOT NULL REFERENCES chats (id) ON DELETE CASCADE,
    user_id   UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (chat_id, user_id)
);


CREATE TABLE messages
(
    id         UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    chat_id    UUID        NOT NULL REFERENCES chats (id) ON DELETE CASCADE,
    sender_id  UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    content    TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_chat_created
    ON messages (chat_id, created_at DESC, id DESC);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE users;
DROP TABLE chats;
DROP TABLE chat_members;
DROP TABLE messages;
DROP INDEX idx_messages_chat_created;
-- +goose StatementEnd
