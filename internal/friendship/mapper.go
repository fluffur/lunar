package friendship

import (
	db "lunar/internal/db/postgres/sqlc"
	"lunar/internal/friendship/dto"
)

func mapFriendWithInfo(row db.ListFriendsWithUsersRow) dto.FriendWithInfo {
	return dto.FriendWithInfo{
		ID:        row.FriendUserID.String(),
		Username:  row.FriendUsername,
		AvatarURL: row.FriendAvatarUrl.String,
	}
}

func mapFriendsWithInfo(rows []db.ListFriendsWithUsersRow) []dto.FriendWithInfo {
	friends := make([]dto.FriendWithInfo, 0, len(rows))
	for _, row := range rows {
		friends = append(friends, mapFriendWithInfo(row))
	}
	return friends
}

func mapIncomingRequestWithInfo(row db.ListIncomingRequestsWithUsersRow) dto.FriendRequestWithInfo {
	response := dto.FriendRequestWithInfo{
		FromUserID: row.FromUserID.String(),
		ToUserID:   row.ToUserID.String(),
		Status:     row.Status,
		Message:    row.Message,
		CreatedAt:  row.CreatedAt.Time.Format("2006-01-02T15:04:05Z07:00"),
		FromUser: &dto.FriendWithInfo{
			ID:        row.FromUserID_2.String(),
			Username:  row.FromUsername,
			AvatarURL: row.FromAvatarUrl.String,
		},
	}

	if row.RespondedAt.Valid {
		respondedAt := row.RespondedAt.Time.Format("2006-01-02T15:04:05Z07:00")
		response.RespondedAt = &respondedAt
	}

	return response
}

func mapIncomingRequestsWithInfo(rows []db.ListIncomingRequestsWithUsersRow) []dto.FriendRequestWithInfo {
	requests := make([]dto.FriendRequestWithInfo, 0, len(rows))
	for _, row := range rows {
		requests = append(requests, mapIncomingRequestWithInfo(row))
	}
	return requests
}

func mapOutgoingRequestWithInfo(row db.ListOutgoingRequestsWithUsersRow) dto.FriendRequestWithInfo {
	response := dto.FriendRequestWithInfo{
		FromUserID: row.FromUserID.String(),
		ToUserID:   row.ToUserID.String(),
		Status:     row.Status,
		Message:    row.Message,
		CreatedAt:  row.CreatedAt.Time.Format("2006-01-02T15:04:05Z07:00"),
		ToUser: &dto.FriendWithInfo{
			ID:        row.ToUserID_2.String(),
			Username:  row.ToUsername,
			AvatarURL: row.ToAvatarUrl.String,
		},
	}

	if row.RespondedAt.Valid {
		respondedAt := row.RespondedAt.Time.Format("2006-01-02T15:04:05Z07:00")
		response.RespondedAt = &respondedAt
	}

	return response
}

func mapOutgoingRequestsWithInfo(rows []db.ListOutgoingRequestsWithUsersRow) []dto.FriendRequestWithInfo {
	requests := make([]dto.FriendRequestWithInfo, 0, len(rows))
	for _, row := range rows {
		requests = append(requests, mapOutgoingRequestWithInfo(row))
	}
	return requests
}
