package dto

type FriendWithInfo struct {
	ID        string `json:"id"`
	Username  string `json:"username"`
	AvatarURL string `json:"avatarUrl"`
}

type FriendRequestWithInfo struct {
	FromUserID  string          `json:"fromUserId"`
	ToUserID    string          `json:"toUserId"`
	Status      string          `json:"status"`
	Message     string          `json:"message,omitempty"`
	CreatedAt   string          `json:"createdAt"`
	RespondedAt *string         `json:"respondedAt,omitempty"`
	FromUser    *FriendWithInfo `json:"fromUser,omitempty"`
	ToUser      *FriendWithInfo `json:"toUser,omitempty"`
}
