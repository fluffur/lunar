package friendship

type SendFriendRequestRequest struct {
	Username string `json:"username" validate:"required,min=3,max=50"`
	Message  string `json:"message" validate:"max=500"`
}

type FriendResponse struct {
	ID        string `json:"id"`
	Username  string `json:"username"`
	AvatarURL string `json:"avatarUrl"`
}

type FriendRequestResponse struct {
	FromUserID  string  `json:"fromUserId"`
	ToUserID    string  `json:"toUserId"`
	Status      string  `json:"status"`
	Message     string  `json:"message,omitempty"`
	CreatedAt   string  `json:"createdAt"`
	RespondedAt *string `json:"respondedAt,omitempty"`
	FromUser    *FriendResponse `json:"fromUser,omitempty"`
	ToUser      *FriendResponse `json:"toUser,omitempty"`
}

type ListFriendsResponse struct {
	Friends []FriendResponse `json:"friends"`
}

type ListFriendRequestsResponse struct {
	Requests []FriendRequestResponse `json:"requests"`
}

