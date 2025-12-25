package config

type DBConfig struct {
	DSN string `env:"DB_DSN,required"`
}

type RedisConfig struct {
	Addr string `env:"REDIS_ADDR" envDefault:"localhost:6379"`
}
