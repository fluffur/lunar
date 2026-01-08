package config

import (
	"github.com/caarlos0/env/v11"
)

type Config struct {
	Addr      int `env:"APP_ADDR" envDefault:"8080"`
	CORS      CORSConfig
	Auth      AuthConfig
	DB        DBConfig
	Redis     RedisConfig
	FileStore FileStoreConfig
	LiveKit   LiveKitConfig
	Features  FeaturesConfig
}

type FeaturesConfig struct {
	HasEmailVerification bool `env:"HAS_EMAIL_VERIFICATION" envDefault:"false"`
}

func Load() (*Config, error) {
	var cfg Config

	if err := env.Parse(&cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}
