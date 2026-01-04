# Lunar

## Prerequisites

- Docker
- Go
- 

## Get started

### Backend
Clone the project
```bash
git clone https://github.com/fluffur/lunar.git && cd lunar
```

Create `.env` file
```bash
cp .env.example .env
```

Start docker containers
```bash
make up 
```

Run migrations 
```bash
make migrate up
```

Check containers status
```
docker compose logs 
```

Swagger documentaion

http://localhost:8080/docs/index.html


### Frontend

Start the vite server
```bash
cd web 
```
```bash
npm install && npm run dev 
```



## Swagger generation

Make sure you are in project root  directory (`lunar`, not `lunar/web`) for running following commands.

### Generate `swagger.yaml` from go code

Install https://github.com/swaggo/swag
```bash
go install github.com/swaggo/swag/cmd/swag@latest
```

Run 
```
make swag
```

File will be generated in: `docs/swagger.yaml`

### Generate frontend client from `swagger.yaml`


Install (sudo required)
```bash
npm install -g @openapitools/openapi-generator-cli
```
Run
```bash
make swag-client
```

Client will be generated in `web/api` directory