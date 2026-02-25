# Quick Reference

## Access URLs

### Default Configuration (with Nginx Proxy)

| Service | URL | Notes |
|---------|-----|-------|
| Main App | http://localhost/ | All traffic through nginx |
| API | http://localhost/api/* | Proxied to backend |
| Health | http://localhost/health | Backend health check |
| WebSocket | ws://localhost/ws | WebSocket connection |

**Backend (3001) and Frontend (8080) are internal only**

### Development Mode (Direct Port Access)

Start with: `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up`

| Service | URL | Port Mapping |
|---------|-----|--------------|
| Nginx | http://localhost:8080 | 8080:80 |
| Frontend | http://localhost:3000 | 3000:8080 |
| Backend API | http://localhost:3001 | 3001:3001 |

---

## Port Mapping Explained

### Production/Default Setup
```
Port 80 (nginx) → Routes to:
  - / → Frontend (internal port 8080)
  - /api → Backend (internal port 3001)
  - /ws → Backend WebSocket (internal port 3001)
```

### Development Setup
```
Port 8080 → Nginx
Port 3000 → Frontend (direct)
Port 3001 → Backend (direct)
```

---

## Common Commands

```bash
# Start (default ports: 3000, 3001)
docker-compose up

# Start with port 8080 for frontend
docker-compose -f docker-compose.port8080.yml up

# View logs
docker-compose logs -f

# Check what's running
docker-compose ps

# Stop
docker-compose down

# Rebuild
docker-compose up --build

# Run diagnostic
./diagnose.sh
```

---

## Troubleshooting

### Getting 404?

**Check:** Are you using the correct port?

```bash
# ✅ Default setup - use port 3000
curl http://localhost:3000

# ❌ Wrong - port 8080 not exposed by default
curl http://localhost:8080
```

**Fix:** Either:
1. Use the correct port (3000)
2. Or use the alternative config:
   ```bash
   docker-compose -f docker-compose.port8080.yml up
   ```

### Can't connect?

```bash
# Check if containers are running
docker-compose ps

# Check logs
docker-compose logs frontend
docker-compose logs backend

# Run full diagnostic
./diagnose.sh
```

---

## Environment Variables

Create `.env` file:

```bash
# Backend
PORT=3001
NODE_ENV=development

# Frontend
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
```

---

## Development vs Production

### Development (docker-compose.yml)
- Hot reload enabled
- Source maps
- Ports: 3000 (frontend), 3001 (backend)

### Production (docker-compose.prod.yml)
- Optimized builds
- No source maps
- Uses pre-built images from registry
- Port: 80 (frontend), 3001 (backend)

---

## Health Checks

```bash
# Backend health
curl http://localhost:3001/health
# Expected: {"status":"healthy","timestamp":"...","connections":0}

# Frontend health
curl http://localhost:3000/health
# Expected: healthy
```

---

## File Locations

```
webapp-template/
├── backend/src/index.js      # Backend code
├── frontend/src/App.js       # Frontend code
├── docker-compose.yml         # Default (port 3000)
├── docker-compose.port8080.yml # Alternative (port 8080)
└── docker-compose.prod.yml    # Production
```

---

## Quick Fixes

### Port already in use
```bash
# Find process using port
lsof -i :3000

# Kill it or change port in docker-compose.yml
```

### Container won't start
```bash
# Clean rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### Changes not showing
```bash
# Rebuild images
docker-compose up --build

# Or force recreate
docker-compose up --force-recreate
```

---

## More Help

- **Detailed troubleshooting:** `TROUBLESHOOTING.md`
- **Nginx 404 issues:** `DEBUG_NGINX.md`
- **Setup instructions:** `README.md`
- **Quick start:** `QUICKSTART.md`
