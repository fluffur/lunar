package model

import "github.com/jackc/pgx/v5/pgtype"

func textOrEmpty(t pgtype.Text) string {
	if t.Valid {
		return t.String
	}
	return ""
}
