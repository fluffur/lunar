ifneq (,$(wildcard .env))
    include .env
    export
endif

.PHONY: up

up:
	docker compose up -d

down:
	docker compose down

swag:
	swag fmt -g cmd/api/main.go
	swag init -g cmd/api/main.go

swag-client:
	openapi-generator-cli generate -i docs/swagger.yaml -g typescript-axios -o web/api
