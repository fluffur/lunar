-- +goose Up
-- +goose StatementBegin
CREATE TABLE email_verification_codes
(
    user_id    UUID PRIMARY KEY
        REFERENCES users (id) ON DELETE CASCADE,
    code_hash  VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ  NOT NULL,
    attempts   INT          NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE email_verification_codes;
-- +goose StatementEnd
