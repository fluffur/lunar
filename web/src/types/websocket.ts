export enum MessageType {
    // Client -> Server
    JoinRoom = "join_room",
    LeaveRoom = "leave_room",
    ChatMessage = "chat_message",

    // Server -> Client
    NewMessage = "new_message",
    IncomingCall = "incoming_call",
}

export interface WSMessage<T = any> {
    type: MessageType;
    payload: T;
}

export interface JoinRoomPayload {
    room_id: string; // slug
}

export interface LeaveRoomPayload {
    room_id: string;
}

export interface ChatMessagePayload {
    room_id: string; // slug, actually backend expects UUID if parsing fails? Wait backend expects UUID string.
    // Let's check backend types.go. It parses UUID from RoomID string. So we need to send roomID (UUID) or handle slug lookup.
    // The current backend implementation `MsgChatMessage` handler parses payload.RoomID as UUID.
    // Does the frontend know the UUID?
    // In `Room.tsx`, we have `roomSlug`. We get messages which contain `room_id`.
    // We might need to fetch the Room object to get the ID, or update backend to accept slugs for messages?
    // Let's check backend logic again.
    // `internal/ws/service.go`: `roomID, err := uuid.Parse(payload.RoomID)`
    // So backend expects UUID.
    // Frontend `Room.tsx` uses `useRoomMessages(roomSlug)`. Does it get the Room ID?
    // `useRoomMessages` fetches messages.
    // We probably should update the backend to accept slugs or ensure frontend has the UUID.
    // Ideally backend resolves slug. But `internal/ws/service.go` doesn't have easy access to `roomRepo.GetBySlug`? 
    // It has `messageRepo`. `Service` struct has `userRepo` and `messageRepo`.
    // It does NOT have `roomRepo`.
    // So we MUST send UUID from frontend.
    content: string;
}

export interface IncomingCallPayload {
    caller_id: string;
    caller_name: string;
    room_name: string;
    token?: string;
}
