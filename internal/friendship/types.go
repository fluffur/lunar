package friendship

type SendRequestInput struct {
	Username string `json:"username" validate:"required,min=3,max=50"`
	Message  string `json:"message" validate:"max=500"`
}
