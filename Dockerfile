

FROM golang:1.25-alpine AS dev

WORKDIR /app

RUN apk add --no-cache git
RUN go install github.com/air-verse/air@latest

COPY go.mod go.sum ./
RUN go mod download

COPY . .

CMD ["air"]

FROM golang:1.25-alpine AS builder

RUN apk add --no-cache git make

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o lunar ./cmd


FROM alpine:3.18 AS prod

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=builder /app/lunar .

EXPOSE 8080

CMD ["./lunar"]
