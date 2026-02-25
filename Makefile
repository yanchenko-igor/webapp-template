.PHONY: help build up down logs clean test lint install debug-frontend

# Default target
help:
	@echo "Available commands:"
	@echo "  make build          - Build Docker images"
	@echo "  make up             - Start all services"
	@echo "  make down           - Stop all services"
	@echo "  make logs           - Show logs"
	@echo "  make clean          - Remove containers, volumes, and images"
	@echo "  make test           - Run tests"
	@echo "  make lint           - Run linters"
	@echo "  make install        - Install dependencies"
	@echo "  make debug-frontend - Debug frontend health check issues"

# Build Docker images
build:
	docker-compose build

# Start services
up:
	docker-compose up -d

# Start services with logs
up-logs:
	docker-compose up

# Stop services
down:
	docker-compose down

# Show logs
logs:
	docker-compose logs -f

# Clean up everything
clean:
	docker-compose down -v --rmi all

# Run tests
test:
	cd backend && npm test
	cd frontend && npm test

# Run linters
lint:
	cd backend && npm run lint
	cd frontend && npm run lint

# Install dependencies
install:
	cd backend && npm install
	cd frontend && npm install

# Restart services
restart:
	docker-compose restart

# Backend logs
logs-backend:
	docker-compose logs -f backend

# Frontend logs
logs-frontend:
	docker-compose logs -f frontend

# Production deployment
prod-up:
	docker-compose -f docker-compose.prod.yml up -d

prod-down:
	docker-compose -f docker-compose.prod.yml down

# Development mode (without Docker)
dev-backend:
	cd backend && npm run dev

dev-frontend:
	cd frontend && npm start

# Debug frontend health check
debug-frontend:
	./debug-frontend.sh

# Rebuild frontend only
rebuild-frontend:
	docker-compose build --no-cache frontend
	docker-compose up -d frontend
