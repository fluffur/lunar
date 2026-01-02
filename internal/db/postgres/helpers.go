package postgres

import (
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

func timestampFromTime(t time.Time) pgtype.Timestamptz {
	return pgtype.Timestamptz{
		Time:  t,
		Valid: !t.IsZero(),
	}
}

func textFromString(s string) pgtype.Text {
	return pgtype.Text{
		String: s,
		Valid:  s != "",
	}
}

func textOrEmpty(text pgtype.Text) string {
	if text.Valid {
		return text.String
	}
	return ""
}
