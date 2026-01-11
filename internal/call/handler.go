package call

import (
	"lunar/internal/httputil"
	"net/http"
)

type Handler struct {
	validator *httputil.Validator
	service   *Service
}

func NewHandler(validator *httputil.Validator, service *Service) *Handler {
	return &Handler{
		validator: validator,
		service:   service,
	}
}

// StartCall godoc
//
//	@Summary	Start a direct call
//	@Tags		call
//	@Accept		json
//	@Produce	json
//	@Security	BearerAuth
//	@Param		input	body		StartCallRequest	true	"Call params"
//	@Success	200		{object}	StartCallResponse
//	@Failure	400		{object}	httputil.ErrorResponse
//	@Failure	500		{object}	httputil.ErrorResponse
//	@Router		/call/start [post]
func (h *Handler) StartCall(w http.ResponseWriter, r *http.Request) {
	caller := httputil.UserFromRequest(r)

	var req StartCallRequest
	if err := httputil.Read(r, &req); err != nil {
		httputil.InvalidRequestBody(w)
		return
	}

	if err := h.validator.Validate(req); err != nil {
		httputil.ValidationError(w, err)
		return
	}

	resp, err := h.service.InitiateCall(r.Context(), caller.ID, req.CalleeID)
	if err != nil {
		httputil.InternalError(w, r, err)
		return
	}

	httputil.SuccessData(w, resp)
}
