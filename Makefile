ifneq (,$(wildcard .env))
    include .env
    export
endif

.PHONY: up

up:
	docker compose up -d

down:
	docker compose down
