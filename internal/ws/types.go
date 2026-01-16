package ws

import (
	"encoding/json"

	"github.com/google/uuid"
)

type MessageType string

const (
	MsgJoinRoom    MessageType = "join_room"
	MsgLeaveRoom   MessageType = "leave_room"
	MsgChatMessage MessageType = "chat_message"

	MsgNewMessage   MessageType = "new_message"
	MsgIncomingCall MessageType = "incoming_call"
)

type ClientMessage struct {
	Type    MessageType     `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

type ServerMessage struct {
	Type    MessageType `json:"type"`
	Payload interface{} `json:"payload"`
}

type JoinRoomPayload struct {
	RoomID string `json:"room_id"`
}

type LeaveRoomPayload struct {
	RoomID string `json:"room_id"`
}

type ChatMessagePayload struct {
	RoomID  string `json:"room_id"`
	Content string `json:"content"`
}

type IncomingCallPayload struct {
	CallerID   uuid.UUID `json:"caller_id"`
	CallerName string    `json:"caller_name"`
	RoomName   string    `json:"room_name"`
	Token      string    `json:"token,omitempty"`
}
