# Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites

- Docker & Docker Compose installed
- Git installed

## Installation

### 1. Extract the Template

```bash
tar -xzf webapp-template.tar.gz
cd webapp-template
```

### 2. Generate Lock Files (Important!)

Before Docker builds, you need `package-lock.json` files:

```bash
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 3. Run Setup Script

```bash
chmod +x setup.sh
./setup.sh
```

The script will:
- Check prerequisites
- Ask for configuration
- Set up environment variables
- Install dependencies or build Docker images

### 4. Start the Application

#### Option A: With Docker (Recommended)

```bash
docker-compose up
```

#### Option B: Without Docker

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm start
```

### 5. Access the Application

- **Main Application**: http://localhost/
- **API**: http://localhost/api/messages
- **Health Check**: http://localhost/health

**All traffic goes through nginx on port 80!**

## Your First Chat Message

1. Open http://localhost/
2. Enter a username
3. Click "Join Chat"
4. Type a message and hit Send!
5. Open in another tab/browser to see real-time updates

## Common Commands

```bash
# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Run tests
make test

# Rebuild
docker-compose up --build
```

## Next Steps

1. **Customize the App**
   - Edit `frontend/src/App.js` for UI changes
   - Edit `backend/src/index.js` for API changes

2. **Set Up GitHub**
   - Create a new repository
   - Push your code
   - Enable GitHub Actions
   - Docker images will auto-build on push

3. **Deploy to Production**
   - See `DEPLOYMENT.md` for detailed instructions
   - Use `docker-compose.prod.yml` for production

4. **Contribute**
   - Read `CONTRIBUTING.md`
   - Make improvements
   - Submit pull requests

## Troubleshooting

### Port Already in Use

```bash
# Change ports in .env file
PORT=3002  # Backend
# Update docker-compose.yml for frontend
```

### Docker Issues

```bash
# Clean rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### Cannot Connect to Backend

Check that:
- Backend is running on port 3001
- CORS is configured (already done)
- Firewall isn't blocking

## File Structure

```
webapp-template/
├── backend/          # Node.js backend
├── frontend/         # React frontend
├── .github/          # CI/CD workflows
├── docker-compose.yml
└── README.md
```

## Key Features

✅ Real-time WebSocket communication
✅ REST API endpoints
✅ Docker containerization
✅ GitHub Actions CI/CD
✅ Multi-stage builds
✅ Health checks
✅ Security scanning
✅ Automated testing

## Getting Help

- 📖 Read `README.md` for full documentation
- 🚀 Check `DEPLOYMENT.md` for deployment
- 🏗️ See `STRUCTURE.md` for architecture
- 🤝 Review `CONTRIBUTING.md` for development

## Example Workflow

```bash
# 1. Extract and enter directory
tar -xzf webapp-template.tar.gz
cd webapp-template

# 2. Quick start with Docker
docker-compose up --build

# 3. Open browser
open http://localhost:3000

# 4. Start coding!
# Edit files, changes will auto-reload
```

Happy coding! 🚀
