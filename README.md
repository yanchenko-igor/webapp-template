# Web Application Template

A complete full-stack web application template with CI/CD, Docker, and GitHub Actions.

## Features

- **Frontend**: React application with real-time updates
- **Backend**: Node.js/Express API with WebSocket support
- **Real-time Chat**: Example application showing frontend-backend-frontend communication
- **Docker**: Multi-stage builds for production-ready images
- **CI/CD**: GitHub Actions workflows for automated testing and deployment
- **Docker Compose**: Easy local development setup

## Architecture

```
┌─────────────┐     HTTP/WS      ┌─────────────┐
│   Frontend  │ ◄──────────────► │   Backend   │
│   (React)   │                  │  (Node.js)  │
└─────────────┘                  └─────────────┘
      │                                 │
      └─────────────────┬───────────────┘
                   Docker Network
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development without Docker)
- Git

### Local Development with Docker

```bash
# Clone the repository
git clone <your-repo-url>
cd webapp-template

# Start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

### Local Development without Docker

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm start
```

## Project Structure

```
.
├── .github/
│   └── workflows/
│       ├── backend-ci.yml      # Backend CI/CD pipeline
│       └── frontend-ci.yml     # Frontend CI/CD pipeline
├── backend/
│   ├── src/
│   ├── Dockerfile
│   ├── package.json
│   └── .dockerignore
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── package.json
│   └── .dockerignore
├── docker-compose.yml
└── README.md
```

## CI/CD Pipeline

The GitHub Actions workflows automatically:

1. **On Pull Request**:
   - Run linting
   - Run tests
   - Build Docker images
   - Verify builds succeed

2. **On Push to Main**:
   - Run all PR checks
   - Build and tag Docker images
   - Push images to GitHub Container Registry

## Environment Variables

### Backend

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

### Frontend

- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_WS_URL` - WebSocket URL

## Docker Images

Images are automatically built and pushed to GitHub Container Registry:

```bash
# Pull latest images
docker pull ghcr.io/<username>/<repo>-backend:latest
docker pull ghcr.io/<username>/<repo>-frontend:latest

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up
```

## Deployment

### Docker Compose (Simple)

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes (Advanced)

See `k8s/` directory for Kubernetes manifests (if needed).

## Development

### Adding New Features

1. Create a feature branch
2. Make changes
3. Test locally with Docker Compose
4. Push to GitHub - CI/CD will validate
5. Create Pull Request

### Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - feel free to use this template for your projects!
