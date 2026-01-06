package config

import (
	"github.com/caarlos0/env/v11"
)

type Config struct {
	Addr      int    `env:"APP_ADDR" envDefault:"8080"`
	ENV       string `env:"APP_ENV" envDefault:"dev"`
	CORS      CORSConfig
	Auth      AuthConfig
	DB        DBConfig
	Redis     RedisConfig
	FileStore FileStoreConfig
}

func Load() (*Config, error) {
	var cfg Config

	if err := env.Parse(&cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}
