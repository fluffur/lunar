package call

import "github.com/google/uuid"

type StartCallRequest struct {
	CalleeID uuid.UUID `json:"callee_id" validate:"required"`
}

type StartCallResponse struct {
	RoomName string `json:"room_name"`
	Token    string `json:"token"`
}
