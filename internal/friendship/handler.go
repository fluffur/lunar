package friendship

import (
	"errors"
	"lunar/internal/httputil"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type Handler struct {
	validator *httputil.Validator
	service   *FriendshipService
}

func NewHandler(validator *httputil.Validator, service *FriendshipService) *Handler {
	return &Handler{
		validator: validator,
		service:   service,
	}
}

func (h *Handler) SendFriendRequest(w http.ResponseWriter, r *http.Request) {
	var req SendRequestInput
	if err := httputil.Read(r, &req); err != nil {
		httputil.InvalidRequestBody(w)
		return
	}

	if err := h.validator.Validate(&req); err != nil {
		httputil.ValidationError(w, err)
		return
	}

	userCtx := httputil.UserFromRequest(r)

	if err := h.service.SendFriendRequestByUsername(r.Context(), userCtx.ID, req.Username, req.Message); err != nil {
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
	fromID, err := uuid.Parse(chi.URLParam(r, "fromId"))
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
	fromID, err := uuid.Parse(chi.URLParam(r, "fromId"))
	if err != nil {
		httputil.BadRequest(w, "Invalid user ID")
		return
	}

	userCtx := httputil.UserFromRequest(r)

	if err := h.service.DeleteFriendRequest(r.Context(), fromID, userCtx.ID); err != nil {
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
	toID, err := uuid.Parse(chi.URLParam(r, "toId"))
	if err != nil {
		httputil.BadRequest(w, "Invalid user ID")
		return
	}

	userCtx := httputil.UserFromRequest(r)

	if err := h.service.DeleteFriendRequest(r.Context(), userCtx.ID, toID); err != nil {
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

	friends, err := h.service.ListFriendsWithInfo(r.Context(), userCtx.ID)
	if err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	httputil.SuccessData(w, friends)
}

func (h *Handler) ListIncomingRequests(w http.ResponseWriter, r *http.Request) {
	userCtx := httputil.UserFromRequest(r)

	requests, err := h.service.ListIncomingRequestsWithInfo(r.Context(), userCtx.ID)
	if err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	httputil.SuccessData(w, requests)
}

func (h *Handler) ListOutgoingRequests(w http.ResponseWriter, r *http.Request) {
	userCtx := httputil.UserFromRequest(r)

	requests, err := h.service.ListOutgoingRequestsWithInfo(r.Context(), userCtx.ID)
	if err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	httputil.SuccessData(w, requests)
}

func (h *Handler) RemoveFriend(w http.ResponseWriter, r *http.Request) {
	friendID, err := uuid.Parse(chi.URLParam(r, "friendId"))
	if err != nil {
		httputil.BadRequest(w, "Invalid friend ID")
		return
	}

	userCtx := httputil.UserFromRequest(r)

	if err := h.service.RemoveFriend(r.Context(), userCtx.ID, friendID); err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	httputil.Success(w)
}
