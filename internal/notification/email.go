package notification

import (
	"context"
	"fmt"
	"log/slog"
)

type EmailSender interface {
	SendVerificationCode(ctx context.Context, email, code string) error
}

type LogEmailSender struct {
	logger *slog.Logger
}

func NewLogEmailSender(logger *slog.Logger) *LogEmailSender {
	return &LogEmailSender{
		logger: logger,
	}
}

func (s *LogEmailSender) SendVerificationCode(ctx context.Context, email, code string) error {
	s.logger.Info("Sent verification code", "email", email, "code", code)
	fmt.Printf("==================================================\n")
	fmt.Printf("Content-Type: text/plain; charset=UTF-8\n")
	fmt.Printf("To: %s\n", email)
	fmt.Printf("Subject: Verification Code\n\n")
	fmt.Printf("Your verification code is: %s\n", code)
	fmt.Printf("==================================================\n")
	return nil
}
