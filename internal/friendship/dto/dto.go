package dto

type FriendWithInfo struct {
	ID        string
	Username  string
	AvatarURL string
}

type FriendRequestWithInfo struct {
	FromUserID  string
	ToUserID    string
	Status      string
	Message     string
	CreatedAt   string
	RespondedAt *string
	FromUser    *FriendWithInfo
	ToUser      *FriendWithInfo
}

