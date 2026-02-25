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
                    ┌─────────────────┐
                    │   Browser       │
                    └────────┬────────┘
                             │ Port 80
                    ┌────────▼────────┐
                    │ Nginx Proxy     │
                    └───┬────────┬────┘
                        │        │
            ┌───────────▼──┐  ┌──▼──────────┐
            │  Frontend    │  │  Backend    │
            │  (Internal)  │  │  (Internal) │
            └──────────────┘  └─────────────┘
```

**All traffic goes through nginx on port 80**
- Frontend and backend are not directly exposed
- Nginx handles routing, SSL, caching, and security

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development without Docker)
- Git

### Setup

**Important:** Before building Docker images for the first time, generate lock files:

```bash
# Generate package-lock.json files
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

Or use the automated setup:

1. **Clone or initialize your repository**

```bash
git init
# or
git clone <your-repo-url>
cd <your-repo>
```

2. **Run the setup script**

```bash
chmod +x setup.sh
./setup.sh
```

The setup script will:
- Check prerequisites
- Configure environment variables
- Install dependencies or build Docker images

3. **Start the application**

#### With Docker (Recommended)

```bash
docker-compose up --build
```

#### Without Docker

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

4. **Access the application**

- **Main Application**: http://localhost/ (nginx routes to frontend)
- **API Endpoints**: http://localhost/api/* (nginx routes to backend)
- **Health Check**: http://localhost/health
- **WebSocket**: ws://localhost/ws

**Note:** All traffic goes through nginx reverse proxy on port 80. Backend (3001) and frontend (8080) ports are internal only and not directly accessible.

### Development Mode (Direct Port Access)

For debugging, you can expose services directly:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

This exposes:
- Nginx: http://localhost:8080
- Frontend: http://localhost:3000 (direct)
- Backend: http://localhost:3001 (direct)

## Project Structure

```
.
├── .github/
│   └── workflows/
│       ├── backend-ci.yml      # Backend CI/CD pipeline
│       ├── frontend-ci.yml     # Frontend CI/CD pipeline
│       └── security.yml        # Security scanning
├── nginx/
│   ├── nginx.conf              # Reverse proxy configuration
│   └── Dockerfile              # Nginx container
├── backend/
│   ├── src/
│   │   ├── index.js           # Main server file
│   │   └── index.test.js      # Backend tests
│   ├── Dockerfile
│   ├── package.json
│   └── .dockerignore
├── frontend/
│   ├── src/
│   │   ├── App.js             # Main React component
│   │   ├── App.css            # Styles
│   │   ├── App.test.js        # Frontend tests
│   │   ├── index.js           # React entry point
│   │   └── index.css          # Global styles
│   ├── public/
│   │   └── index.html
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── .dockerignore
├── docker-compose.yml          # Main setup (with nginx proxy)
├── docker-compose.dev.yml      # Development override (direct ports)
├── docker-compose.prod.yml     # Production setup
├── Makefile                    # Common commands
├── setup.sh                    # Setup script
├── .env.example                # Environment template
├── .gitignore
├── README.md                   # This file
├── NGINX_PROXY.md             # Nginx proxy documentation
├── QUICKSTART.md              # 5-minute start guide
├── DEPLOYMENT.md              # Deployment guide
├── STRUCTURE.md               # Architecture details
└── CONTRIBUTING.md            # Contribution guidelines
```

## GitHub Actions Setup

### 1. Enable GitHub Actions

The workflows in `.github/workflows/` will automatically run when you push to GitHub.

### 2. Configure Permissions

1. Go to your repository **Settings** → **Actions** → **General**
2. Under "Workflow permissions", select **Read and write permissions**
3. Check **Allow GitHub Actions to create and approve pull requests**
4. Click **Save**

### 3. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

The CI/CD pipeline will automatically:
- Run tests
- Lint code
- Build Docker images
- Push images to GitHub Container Registry (ghcr.io)
- Run security scans

### 4. View Your Images

After the first successful push, your Docker images will be available at:
- `ghcr.io/<username>/<repo>-backend:latest`
- `ghcr.io/<username>/<repo>-frontend:latest`

## Common Commands

Using Make (recommended):

```bash
make help          # Show all available commands
make build         # Build Docker images
make up            # Start all services
make down          # Stop all services
make logs          # View logs
make test          # Run tests
make clean         # Remove containers and images
```

Using Docker Compose directly:

```bash
docker-compose up --build        # Build and start
docker-compose down              # Stop services
docker-compose logs -f           # Follow logs
docker-compose restart           # Restart services
```

## Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

### Backend Variables
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

### Frontend Variables
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_WS_URL` - WebSocket URL

## Development Workflow

1. **Make changes** to backend (`backend/src/`) or frontend (`frontend/src/`)
2. **Test locally** with Docker Compose or npm scripts
3. **Run tests**: `make test`
4. **Commit and push** to GitHub
5. **CI/CD runs automatically** - view progress in Actions tab
6. **Docker images** are built and published on successful builds

## Testing

```bash
# All tests
make test

# Backend only
cd backend && npm test

# Frontend only
cd frontend && npm test

# With coverage
cd backend && npm test -- --coverage
```

## Deployment

### Quick Deploy with Docker Compose

```bash
# Pull latest images
export GITHUB_REPOSITORY=username/repo
docker pull ghcr.io/${GITHUB_REPOSITORY}-backend:latest
docker pull ghcr.io/${GITHUB_REPOSITORY}-frontend:latest

# Start production stack
docker-compose -f docker-compose.prod.yml up -d
```

### Cloud Platforms

Deploy to any platform that supports Docker:
- AWS (ECS, Fargate, App Runner)
- Google Cloud (Cloud Run, GKE)
- Azure (Container Instances, AKS)
- DigitalOcean (App Platform)
- Heroku (Container Registry)
- And more!

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for detailed platform-specific instructions.

## Customization

### Modify the Application

**Backend API:**
- Edit `backend/src/index.js`
- Add routes, WebSocket handlers, or middleware
- Tests in `backend/src/index.test.js`

**Frontend UI:**
- Edit `frontend/src/App.js` for components
- Edit `frontend/src/App.css` for styles
- Tests in `frontend/src/App.test.js`

### Add Features

Some ideas to extend the template:
- User authentication (JWT, OAuth)
- Database integration (PostgreSQL, MongoDB, Redis)
- File uploads
- Private messaging
- Message persistence
- User profiles
- Rate limiting
- API documentation (Swagger)
- Metrics and monitoring

## Documentation

- **[NGINX_PROXY.md](NGINX_PROXY.md)** - Nginx reverse proxy setup and configuration
- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 5 minutes
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
- **[STRUCTURE.md](STRUCTURE.md)** - Project architecture & file structure
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Development guidelines

## Technology Stack

### Backend
- Node.js 18 (Alpine Linux)
- Express.js 4.x
- WebSocket (ws library)
- Jest + Supertest (testing)
- ESLint (code quality)

### Frontend
- React 18
- Create React App
- WebSocket API
- React Testing Library
- Nginx (production server)

### DevOps
- Docker & Docker Compose
- GitHub Actions
- GitHub Container Registry
- Trivy (security scanning)
- Multi-platform builds (amd64, arm64)

## Security

- ✅ Non-root Docker containers
- ✅ Multi-stage Docker builds
- ✅ Automated security scanning
- ✅ Health checks
- ✅ CORS configuration
- ✅ Security headers (nginx)
- ✅ No secrets in repository

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Frontend Health Check Failing

If you see: `dependency frontend failed to start: container webapp-frontend is unhealthy`

**Quick Fix:**
```bash
docker-compose down
docker-compose build --no-cache frontend
docker-compose up
```

**Debug:**
```bash
make debug-frontend
# or
./debug-frontend.sh
```

See [FRONTEND_HEALTH_DEBUG.md](FRONTEND_HEALTH_DEBUG.md) for detailed troubleshooting.

### Port Already in Use

Change ports in `.env`:
```env
PORT=3002  # Backend
```

And in `docker-compose.yml` for frontend.

### Docker Build Fails

```bash
# Clean rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### Cannot Connect to Backend

Verify:
- Backend is running: `docker-compose ps`
- Check logs: `docker-compose logs backend`
- Health endpoint: `curl http://localhost:3001/health`

### CI/CD Issues

Check:
- GitHub Actions permissions are set correctly
- Workflow files have correct indentation (YAML)
- Secrets are configured if needed
- View detailed logs in Actions tab

## Support

- 📖 [Documentation](QUICKSTART.md)
- 🐛 [Report Issues](../../issues)
- 💬 [Discussions](../../discussions)

## License

MIT License - feel free to use this template for your projects!

---

**Ready to build something awesome?** Start by running `./setup.sh`! 🚀
