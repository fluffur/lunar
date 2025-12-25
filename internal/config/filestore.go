package config

import "path/filepath"

type FileStoreConfig struct {
	RootDir    string `env:"APP_FILESTORE_ROOT" envDefault:"./uploads"`
	AvatarsDir string `env:"APP_FILESTORE_ROOT" envDefault:"avatars"`
}

func (c FileStoreConfig) AvatarsPath() string {
	return filepath.Join(c.RootDir, c.AvatarsDir)
}
