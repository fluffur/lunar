package config

import "time"

type AuthConfig struct {
	AccessToken  AccessTokenConfig
	RefreshToken RefreshTokenConfig
}

type AccessTokenConfig struct {
	TTL    time.Duration `env:"AUTH_ACCESS_TTL" envDefault:"15m"`
	Secret string        `env:"AUTH_JWT_SECRET,required"`
	Issuer string        `env:"AUTH_ACCESS_ISSUER" envDefault:"lunar"`
}

type RefreshTokenConfig struct {
	TTL           time.Duration `env:"AUTH_REFRESH_TTL" envDefault:"720h"`
	KeyPrefix     string        `env:"AUTH_REFRESH_KEY_PREFIX" envDefault:"refresh:"`
	UserKeyPrefix string        `env:"AUTH_REFRESH_USER_KEY_PREFIX" envDefault:"user:"`
}
