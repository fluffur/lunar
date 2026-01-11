package ws

import (
	"encoding/json"

	"github.com/google/uuid"
)

// MessageType defines the type of message sent between client and server
type MessageType string

const (
	// Client -> Server messages
	MsgJoinRoom    MessageType = "join_room"
	MsgLeaveRoom   MessageType = "leave_room"
	MsgChatMessage MessageType = "chat_message"

	// Server -> Client messages
	MsgNewMessage   MessageType = "new_message"
	MsgIncomingCall MessageType = "incoming_call"
)

// ClientMessage represents a message sent from the client to the server
type ClientMessage struct {
	Type    MessageType     `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

// ServerMessage represents a message sent from the server to the client
type ServerMessage struct {
	Type    MessageType `json:"type"`
	Payload interface{} `json:"payload"`
}

// Payload structs for specific message types

type JoinRoomPayload struct {
	RoomID string `json:"room_id"` // Using string to accommodate slugs if needed, but uuid preferred
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
	RoomName   string    `json:"room_name"`       // LiveKit room name
	Token      string    `json:"token,omitempty"` // Optional: if we want to send token directly (security risk?) preferably fetch via API
}
