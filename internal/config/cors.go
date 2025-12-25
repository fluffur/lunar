package config

type CORSConfig struct {
	AllowedOrigins   []string `env:"CORS_ALLOWED_ORIGINS" envSeparator:","`
	AllowedMethods   []string `env:"CORS_ALLOWED_METHODS" envSeparator:","`
	AllowedHeaders   []string `env:"CORS_ALLOWED_HEADERS" envSeparator:","`
	ExposedHeaders   []string `env:"CORS_EXPOSED_HEADERS" envSeparator:","`
	AllowCredentials bool     `env:"CORS_ALLOW_CREDENTIALS" envDefault:"true"`
	MaxAge           int      `env:"CORS_MAX_AGE" envDefault:"3600"`
}
