package config

type DBConfig struct {
	DSN string `env:"APP_DB_DSN,required"`
}

type RedisConfig struct {
	Addr string `env:"APP_REDIS_ADDR" envDefault:"localhost:6379"`
}
