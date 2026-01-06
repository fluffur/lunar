package config

type LiveKitConfig struct {
	APIKey    string `env:"LIVEKIT_API_KEY"`
	APISecret string `env:"LIVEKIT_API_SECRET"`
}
