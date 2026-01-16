package call

import (
	"bytes"
	"lunar/internal/httputil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestStartCall_Validation(t *testing.T) {
	validator := httputil.NewValidator()
	handler := NewHandler(validator, nil)

	reqBody := []byte(`{"callee_id": "invalid-uuid"}`)
	req := httptest.NewRequest("POST", "/call/start", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")

	ctx := httputil.WithUser(req.Context(), &httputil.UserContext{
		ID: uuid.New(),
	})
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()
	handler.StartCall(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestStartCall_MissingBody(t *testing.T) {
	validator := httputil.NewValidator()
	handler := NewHandler(validator, nil)

	req := httptest.NewRequest("POST", "/call/start", nil)

	ctx := httputil.WithUser(req.Context(), &httputil.UserContext{
		ID: uuid.New(),
	})
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()
	handler.StartCall(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}
