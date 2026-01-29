-- +goose Up
-- +goose StatementBegin
CREATE INDEX IF NOT EXISTS idx_users_username_lower ON users (LOWER(username));
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS idx_users_username_lower;
-- +goose StatementEnd