-- +goose Up
-- +goose StatementBegin
ALTER TABLE email_verification_codes ADD COLUMN pending_email VARCHAR(255);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE email_verification_codes DROP COLUMN pending_email;
-- +goose StatementEnd
