# Lunar

[Читать на русском](README.ru.md)

## Technologies

- **Backend**: Go
- **Frontend**: React, TypeScript, Vite
- **Database**: PostgreSQL, Redis
- **Communication**: WebSocket
- **Tools**: Docker, SQLC, Swagger

## Prerequisites

- [Docker](https://www.docker.com/) & Docker Compose
- [Go](https://go.dev/) (1.21+)
- [Node.js](https://nodejs.org/) & npm

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/fluffur/lunar.git
cd lunar
```

### 2. Environment Setup
Create the `.env` file from the example:
```bash
cp .env.example .env
```

### 3. Start Backend Services
Start the Docker containers (PostgreSQL, Redis, API):
```bash
make up
```

Run database migrations:
```bash
make migrate-up
```

Check logs to ensure everything is running:
```bash
docker compose logs -f
```

Documentation is available at: http://localhost:8080/docs/index.html

### 4. Start Frontend
Open a new terminal for the frontend:

```bash
cd web
npm install
npm run dev
```
The application will be available at http://localhost:5173

## Development

### Project Structure
```
.
├── cmd                 # Application entry points
├── docs                # Swagger documentation
├── internal            # Private application and library code
│   ├── db              # Database implementations (Postgres, Redis, SQLC)
│   ├── message         # Message logic
│   ├── model           # Domain models
│   ├── room            # Room logic
│   ├── user            # User logic
│   └── ws              # WebSocket handler
├── migrations          # Database migrations
├── sql                 # SQL queries for SQLC
└── web                 # Frontend application (React)
```

### Database & SQLC
We use [sqlc](https://sqlc.dev/) to generate type-safe Go code from SQL queries.

1. Define queries in `sql/queries/*.sql`.
2. Generate Go code:
    ```bash
    make sqlc
    ```

### API Documentation & Client
We use [Swagger](https://swagger.io/) for API documentation and automatic client generation.

**Generate Swagger docs (`swagger.yaml`):**
```bash
# Install swaggo
go install github.com/swaggo/swag/cmd/swag@latest

# Generate
make swag
```

**Generate Frontend Client:**
```bash
# Install openapi-generator-cli
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript client
make swag-client
```
The generated client code will be in `web/api`.