ifneq (,$(wildcard .env))
    include .env
    export
endif

.PHONY: up down swag swag-client

up:
	docker compose up -d

migrate-up:
	docker compose exec api go run ./cmd/migrate up

down:
	docker compose down

swag:
	swag fmt -g cmd/api/main.go
	swag init -g cmd/api/main.go

swag-client:
	openapi-generator-cli generate -i docs/swagger.yaml -g typescript-axios -o web/api

sqlc:
	sqlc generate

logs:
	docker compose logs api -f