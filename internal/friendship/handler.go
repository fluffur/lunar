package friendship

import (
	"errors"
	"lunar/internal/httputil"
	"lunar/internal/repository"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type Handler struct {
	validator *httputil.Validator
	service   *FriendshipService
	userRepo  repository.UserRepository
}

func NewHandler(validator *httputil.Validator, service *FriendshipService, userRepo repository.UserRepository) *Handler {
	return &Handler{
		validator: validator,
		service:   service,
		userRepo:  userRepo,
	}
}

func (h *Handler) SendFriendRequest(w http.ResponseWriter, r *http.Request) {
	var req SendFriendRequestRequest
	if err := httputil.Read(r, &req); err != nil {
		httputil.InvalidRequestBody(w)
		return
	}

	if err := h.validator.Validate(&req); err != nil {
		httputil.ValidationError(w, err)
		return
	}

	userCtx := httputil.UserFromRequest(r)

	if err := h.service.SendFriendRequest(r.Context(), userCtx.ID, req.Username, req.Message); err != nil {
		switch {
		case errors.Is(err, ErrUserNotFound):
			httputil.NotFound(w, "User not found")
			return
		case errors.Is(err, ErrCannotAddSelf):
			httputil.ValidationError(w, map[string]string{"username": err.Error()})
			return
		case errors.Is(err, ErrFriendRequestExists):
			httputil.Conflict(w, err.Error())
			return
		case errors.Is(err, ErrAlreadyFriends):
			httputil.Conflict(w, err.Error())
			return
		case errors.Is(err, ErrBlocked):
			httputil.Forbidden(w, err.Error())
			return
		}
		httputil.InternalError(w, r, err)
		return
	}

	httputil.Success(w)
}

func (h *Handler) AcceptFriendRequest(w http.ResponseWriter, r *http.Request) {
	fromIDStr := chi.URLParam(r, "fromId")
	fromID, err := uuid.Parse(fromIDStr)
	if err != nil {
		httputil.BadRequest(w, "Invalid user ID")
		return
	}

	userCtx := httputil.UserFromRequest(r)

	if err := h.service.AcceptFriendRequest(r.Context(), userCtx.ID, fromID); err != nil {
		switch {
		case errors.Is(err, ErrFriendRequestNotFound):
			httputil.NotFound(w, "Friend request not found")
			return
		}
		httputil.InternalError(w, r, err)
		return
	}

	httputil.Success(w)
}

func (h *Handler) RejectFriendRequest(w http.ResponseWriter, r *http.Request) {
	fromIDStr := chi.URLParam(r, "fromId")
	fromID, err := uuid.Parse(fromIDStr)
	if err != nil {
		httputil.BadRequest(w, "Invalid user ID")
		return
	}

	userCtx := httputil.UserFromRequest(r)

	if err := h.service.RejectFriendRequest(r.Context(), userCtx.ID, fromID); err != nil {
		switch {
		case errors.Is(err, ErrFriendRequestNotFound):
			httputil.NotFound(w, "Friend request not found")
			return
		}
		httputil.InternalError(w, r, err)
		return
	}

	httputil.Success(w)
}

func (h *Handler) CancelFriendRequest(w http.ResponseWriter, r *http.Request) {
	toIDStr := chi.URLParam(r, "toId")
	toID, err := uuid.Parse(toIDStr)
	if err != nil {
		httputil.BadRequest(w, "Invalid user ID")
		return
	}

	userCtx := httputil.UserFromRequest(r)

	if err := h.service.CancelFriendRequest(r.Context(), userCtx.ID, toID); err != nil {
		switch {
		case errors.Is(err, ErrFriendRequestNotFound):
			httputil.NotFound(w, "Friend request not found")
			return
		}
		httputil.InternalError(w, r, err)
		return
	}

	httputil.Success(w)
}

func (h *Handler) ListFriends(w http.ResponseWriter, r *http.Request) {
	userCtx := httputil.UserFromRequest(r)

	friendships, err := h.service.ListFriends(r.Context(), userCtx.ID)
	if err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	friends := make([]FriendResponse, 0, len(friendships))
	for _, f := range friendships {
		user, err := h.userRepo.GetByID(r.Context(), f.FriendID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				continue
			}
			httputil.InternalError(w, r, err)
			return
		}

		friends = append(friends, FriendResponse{
			ID:        user.ID.String(),
			Username:  user.Username,
			AvatarURL: user.AvatarURL,
		})
	}

	httputil.SuccessData(w, ListFriendsResponse{Friends: friends})
}

func (h *Handler) ListIncomingRequests(w http.ResponseWriter, r *http.Request) {
	userCtx := httputil.UserFromRequest(r)

	requests, err := h.service.ListIncomingRequests(r.Context(), userCtx.ID)
	if err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	responses := make([]FriendRequestResponse, 0, len(requests))
	for _, req := range requests {
		fromUser, err := h.userRepo.GetByID(r.Context(), req.FromUserID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				continue
			}
			httputil.InternalError(w, r, err)
			return
		}

		response := FriendRequestResponse{
			FromUserID: req.FromUserID.String(),
			ToUserID:   req.ToUserID.String(),
			Status:     string(req.Status),
			Message:    req.Message,
			CreatedAt:  req.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			FromUser: &FriendResponse{
				ID:        fromUser.ID.String(),
				Username:  fromUser.Username,
				AvatarURL: fromUser.AvatarURL,
			},
		}

		if req.RespondedAt != nil {
			respondedAt := req.RespondedAt.Format("2006-01-02T15:04:05Z07:00")
			response.RespondedAt = &respondedAt
		}

		responses = append(responses, response)
	}

	httputil.SuccessData(w, ListFriendRequestsResponse{Requests: responses})
}

func (h *Handler) ListOutgoingRequests(w http.ResponseWriter, r *http.Request) {
	userCtx := httputil.UserFromRequest(r)

	requests, err := h.service.ListOutgoingRequests(r.Context(), userCtx.ID)
	if err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	responses := make([]FriendRequestResponse, 0, len(requests))
	for _, req := range requests {
		toUser, err := h.userRepo.GetByID(r.Context(), req.ToUserID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				continue
			}
			httputil.InternalError(w, r, err)
			return
		}

		response := FriendRequestResponse{
			FromUserID: req.FromUserID.String(),
			ToUserID:   req.ToUserID.String(),
			Status:     string(req.Status),
			Message:    req.Message,
			CreatedAt:  req.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			ToUser: &FriendResponse{
				ID:        toUser.ID.String(),
				Username:  toUser.Username,
				AvatarURL: toUser.AvatarURL,
			},
		}

		if req.RespondedAt != nil {
			respondedAt := req.RespondedAt.Format("2006-01-02T15:04:05Z07:00")
			response.RespondedAt = &respondedAt
		}

		responses = append(responses, response)
	}

	httputil.SuccessData(w, ListFriendRequestsResponse{Requests: responses})
}

func (h *Handler) RemoveFriend(w http.ResponseWriter, r *http.Request) {
	friendIDStr := chi.URLParam(r, "friendId")
	friendID, err := uuid.Parse(friendIDStr)
	if err != nil {
		httputil.BadRequest(w, "Invalid friend ID")
		return
	}

	userCtx := httputil.UserFromRequest(r)

	if err := h.service.RemoveFriend(r.Context(), userCtx.ID, friendID); err != nil {
		switch {
		case errors.Is(err, ErrNotFriends):
			httputil.NotFound(w, "Friendship not found")
			return
		}
		httputil.InternalError(w, r, err)
		return
	}

	httputil.Success(w)
}
