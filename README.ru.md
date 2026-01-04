# Lunar

[Read in English](README.md)

## Технологии

- **Backend**: Go
- **Frontend**: React, TypeScript, Vite
- **База данных**: PostgreSQL, Redis
- **Связь**: WebSocket
- **Инструменты**: Docker, SQLC, Swagger

## Требования

- [Docker](https://www.docker.com/) & Docker Compose
- [Go](https://go.dev/) (1.21+)
- [Node.js](https://nodejs.org/) & npm

## Начало работы

### 1. Клонирование репозитория
```bash
git clone https://github.com/fluffur/lunar.git
cd lunar
```

### 2. Настройка окружения
Создайте файл `.env` из примера:
```bash
cp .env.example .env
```

### 3. Запуск Backend сервисов
Запустите Docker контейнеры (PostgreSQL, Redis, API):
```bash
make up
```

Запустите миграции базы данных:
```bash
make migrate-up
```

Проверьте логи, чтобы убедиться, что все работает:
```bash
docker compose logs -f
```

Документация доступна по адресу: http://localhost:8080/docs/index.html

### 4. Запуск Frontend
Откройте новый терминал для фронтенда:

```bash
cd web
npm install
npm run dev
```
Приложение будет доступно по адресу http://localhost:5173

## Разработка

### Структура проекта
```
.
├── cmd                 # Точки входа приложения
├── docs                # Swagger документация
├── internal            # Приватный код приложения и библиотеки
│   ├── db              # Реализации БД (Postgres, Redis, SQLC)
│   ├── message         # Логика сообщений
│   ├── model           # Доменные модели
│   ├── room            # Логика комнат
│   ├── user            # Логика пользователей
│   └── ws              # WebSocket обработчик
├── migrations          # Миграции базы данных
├── sql                 # SQL запросы для SQLC
└── web                 # Frontend приложение (React)
```

### База данных и SQLC
Мы используем [sqlc](https://sqlc.dev/) для генерации типобезопасного Go кода из SQL запросов.

1. Определите запросы в `sql/queries/*.sql`.
2. Сгенерируйте Go код:
    ```bash
    make sqlc
    ```

### API Документация и Клиент
Мы используем [Swagger](https://swagger.io/) для документации API и автоматической генерации клиента.

**Генерация Swagger документации (`swagger.yaml`):**
```bash
# Установка swaggo
go install github.com/swaggo/swag/cmd/swag@latest

# Генерация
make swag
```

**Генерация Frontend клиента:**
```bash
# Установка openapi-generator-cli
npm install -g @openapitools/openapi-generator-cli

# Генерация TypeScript клиента
make swag-client
```
Сгенерированный код клиента будет находиться в директории `web/api`.
