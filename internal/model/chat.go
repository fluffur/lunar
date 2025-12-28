package model

type Chat struct {
	Name string `json:"name,omitempty"`
	Type string `json:"type" binding:"required"`
}
