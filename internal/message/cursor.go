package message

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Cursor struct {
	ID        uuid.UUID `json:"id"`
	CreatedAt time.Time `json:"createdAt"`
}

type cursorUnmapped struct {
	ID        string `json:"id"`
	CreatedAt string `json:"createdAt"`
}

func (c Cursor) MarshalJSON() ([]byte, error) {
	type Alias Cursor
	return json.Marshal(&struct {
		CreatedAt string `json:"createdAt"`
		Alias
	}{
		CreatedAt: c.CreatedAt.Format(time.RFC3339Nano),
		Alias:     (Alias)(c),
	})
}

func (c *Cursor) UnmarshalJSON(data []byte) error {
	var aux cursorUnmapped
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	id, err := uuid.Parse(aux.ID)
	if err != nil {
		return err
	}

	t, err := time.Parse(time.RFC3339Nano, aux.CreatedAt)
	if err != nil {
		return err
	}

	c.ID = id
	c.CreatedAt = t

	return nil
}
