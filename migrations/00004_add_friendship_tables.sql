-- +goose Up
-- +goose StatementBegin
CREATE TABLE friend_requests (
                                 from_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                 to_user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                 status       text NOT NULL DEFAULT 'pending',
                                 message      text NOT NULL DEFAULT '',
                                 created_at   timestamptz NOT NULL DEFAULT now(),
                                 responded_at timestamptz NULL,
                                 PRIMARY KEY (from_user_id, to_user_id),
                                 CONSTRAINT friend_requests_no_self CHECK (from_user_id <> to_user_id)
);

CREATE INDEX friend_requests_to_idx ON friend_requests(to_user_id, created_at);
CREATE INDEX friend_requests_from_idx ON friend_requests(from_user_id, created_at);

CREATE TABLE friendships (
                             user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                             friend_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                             created_at timestamptz NOT NULL DEFAULT now(),
                             PRIMARY KEY (user_id, friend_id),
                             CONSTRAINT friendships_no_self CHECK (user_id <> friend_id)
);

CREATE INDEX friendships_friend_idx ON friendships(friend_id);

CREATE TABLE user_blocks (
                             from_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                             to_user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                             created_at   timestamptz NOT NULL DEFAULT now(),
                             PRIMARY KEY (from_user_id, to_user_id),
                             CONSTRAINT user_blocks_no_self CHECK (from_user_id <> to_user_id)
);

CREATE INDEX user_blocks_to_idx ON user_blocks(to_user_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS user_blocks;
DROP TABLE IF EXISTS friendships;
DROP TABLE IF EXISTS friend_requests;
-- +goose StatementEnd
