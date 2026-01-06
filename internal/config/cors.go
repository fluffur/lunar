package config

type CORSConfig struct {
	AllowedOrigins   []string `env:"CORS_ALLOWED_ORIGINS" envSeparator:"," envDefault:"https://*,http://*"`
	AllowedMethods   []string `env:"CORS_ALLOWED_METHODS" envSeparator:"," envDefault:"GET,POST,PUT,PATCH,DELETE,OPTIONS"`
	AllowedHeaders   []string `env:"CORS_ALLOWED_HEADERS" envSeparator:"," envDefault:"Origin,Content-Type,Accept,Authorization"`
	ExposedHeaders   []string `env:"CORS_EXPOSED_HEADERS" envSeparator:"," envDefault:"Content-Length,Content-Type"`
	AllowCredentials bool     `env:"CORS_ALLOW_CREDENTIALS" envDefault:"true"`
	MaxAge           int      `env:"CORS_MAX_AGE" envDefault:"3600"`
}
