#!/bin/bash

# Web Application Template Setup Script
# This script helps initialize and configure the project

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Web Application Template Setup      ║${NC}"
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo ""

# Check for required tools
echo -e "${YELLOW}Checking prerequisites...${NC}"

command -v docker >/dev/null 2>&1 || { echo -e "${RED}Docker is required but not installed. Aborting.${NC}" >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo -e "${RED}Docker Compose is required but not installed. Aborting.${NC}" >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo -e "${YELLOW}Node.js not found. Docker will be used for local development.${NC}"; }

echo -e "${GREEN}✓ Prerequisites check passed${NC}"
echo ""

# Ask for project configuration
echo -e "${YELLOW}Project Configuration${NC}"
read -p "Enter your project name (default: webapp-template): " PROJECT_NAME
PROJECT_NAME=${PROJECT_NAME:-webapp-template}

read -p "Enter your GitHub username/organization (default: username): " GITHUB_USER
GITHUB_USER=${GITHUB_USER:-username}

read -p "Enter backend port (default: 3001): " BACKEND_PORT
BACKEND_PORT=${BACKEND_PORT:-3001}

read -p "Enter frontend port (default: 3000): " FRONTEND_PORT
FRONTEND_PORT=${FRONTEND_PORT:-3000}

# Create .env file
echo ""
echo -e "${YELLOW}Creating .env file...${NC}"
cat > .env << EOF
# Backend Environment Variables
PORT=${BACKEND_PORT}
NODE_ENV=development

# Frontend Environment Variables
REACT_APP_API_URL=http://localhost:${BACKEND_PORT}
REACT_APP_WS_URL=ws://localhost:${BACKEND_PORT}

# Production Settings
GITHUB_REPOSITORY=${GITHUB_USER}/${PROJECT_NAME}
EOF

echo -e "${GREEN}✓ .env file created${NC}"

# Ask for setup type
echo ""
echo -e "${YELLOW}Setup Type${NC}"
echo "1) Docker only (recommended for beginners)"
echo "2) Local development (Node.js + npm)"
echo "3) Both"
read -p "Choose setup type (1-3): " SETUP_TYPE

case $SETUP_TYPE in
  1)
    echo ""
    echo -e "${YELLOW}Building Docker images...${NC}"
    docker-compose build
    echo -e "${GREEN}✓ Docker images built${NC}"
    
    echo ""
    echo -e "${YELLOW}Starting services...${NC}"
    docker-compose up -d
    echo -e "${GREEN}✓ Services started${NC}"
    ;;
  2)
    echo ""
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd backend && npm install && cd ..
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
    
    echo ""
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd frontend && npm install && cd ..
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
    ;;
  3)
    echo ""
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd backend && npm install && cd ..
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
    
    echo ""
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd frontend && npm install && cd ..
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
    
    echo ""
    echo -e "${YELLOW}Building Docker images...${NC}"
    docker-compose build
    echo -e "${GREEN}✓ Docker images built${NC}"
    ;;
  *)
    echo -e "${RED}Invalid choice. Exiting.${NC}"
    exit 1
    ;;
esac

# Setup complete
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Setup Complete! 🎉            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo ""

if [ "$SETUP_TYPE" = "1" ] || [ "$SETUP_TYPE" = "3" ]; then
  echo -e "  Frontend: ${GREEN}http://localhost:${FRONTEND_PORT}${NC}"
  echo -e "  Backend:  ${GREEN}http://localhost:${BACKEND_PORT}${NC}"
  echo ""
  echo -e "  View logs:    ${YELLOW}docker-compose logs -f${NC}"
  echo -e "  Stop:         ${YELLOW}docker-compose down${NC}"
  echo -e "  Restart:      ${YELLOW}docker-compose restart${NC}"
fi

if [ "$SETUP_TYPE" = "2" ] || [ "$SETUP_TYPE" = "3" ]; then
  echo ""
  echo -e "  Start backend:  ${YELLOW}cd backend && npm run dev${NC}"
  echo -e "  Start frontend: ${YELLOW}cd frontend && npm start${NC}"
fi

echo ""
echo -e "  Run tests:    ${YELLOW}make test${NC}"
echo -e "  View help:    ${YELLOW}make help${NC}"
echo ""
echo -e "${YELLOW}For deployment instructions, see DEPLOYMENT.md${NC}"
echo ""
