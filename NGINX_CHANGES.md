# Nginx Reverse Proxy - Summary of Changes

## What Changed

The application now uses **nginx as a reverse proxy** on port 80 for all traffic.

## Before (Direct Port Access)

```
Browser → Frontend (port 3000)
Browser → Backend (port 3001)
```

## After (Nginx Proxy)

```
Browser → Nginx (port 80) → Routes to:
                              ├── Frontend (internal)
                              └── Backend (internal)
```

---

## Quick Start

### 1. Start the Application

```bash
docker-compose up
```

### 2. Access Everything on Port 80

| What | URL |
|------|-----|
| Frontend | http://localhost/ |
| API | http://localhost/api/messages |
| Health | http://localhost/health |
| WebSocket | ws://localhost/ws |

---

## Key Benefits

✅ **Single port (80)** - Professional deployment pattern
✅ **Security** - Backend/frontend not directly exposed
✅ **SSL ready** - Easy to add HTTPS
✅ **Production ready** - Standard architecture
✅ **Load balancing** - Can scale easily

---

## For Development/Debugging

If you need direct access to services:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

This exposes:
- Nginx: http://localhost:8080
- Frontend: http://localhost:3000 (direct)
- Backend: http://localhost:3001 (direct)

---

## Architecture Diagram

```
┌─────────────────┐
│   Browser       │
│   Port 80       │
└────────┬────────┘
         │
┌────────▼────────┐
│  Nginx Proxy    │
│  - Routing      │
│  - SSL/TLS      │
│  - Caching      │
│  - Security     │
└───┬────────┬────┘
    │        │
    │        └──────────────┐
    │                       │
┌───▼──────────┐   ┌────────▼────────┐
│  Frontend    │   │  Backend        │
│  Port 8080   │   │  Port 3001      │
│  (internal)  │   │  (internal)     │
└──────────────┘   └─────────────────┘
```

---

## URL Routing

### Frontend (Static Files)
- `GET /` → Frontend
- `GET /static/*` → Frontend
- `GET /index.html` → Frontend

### Backend (API)
- `GET /api/messages` → Backend
- `POST /api/messages` → Backend
- `GET /api/stats` → Backend
- `GET /health` → Backend

### WebSocket
- `WS /ws` → Backend WebSocket
- Upgrade connection supported

---

## Configuration Files

### Added
- `nginx/nginx.conf` - Reverse proxy config
- `nginx/Dockerfile` - Nginx container
- `docker-compose.dev.yml` - Development override
- `NGINX_PROXY.md` - Complete documentation

### Modified
- `docker-compose.yml` - Now includes nginx service
- `docker-compose.prod.yml` - Production with nginx
- `frontend/src/App.js` - Uses proxy URLs
- `.env.example` - Updated URLs
- `README.md` - Updated documentation

---

## Migration Guide

### If You Were Using Direct Ports

**Old code:**
```javascript
const API_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';
```

**New code:**
```javascript
const API_URL = 'http://localhost/api';
const WS_URL = 'ws://localhost/ws';
```

Or use environment variables (already set up):
```javascript
const API_URL = process.env.REACT_APP_API_URL;
const WS_URL = process.env.REACT_APP_WS_URL;
```

---

## Adding HTTPS/SSL

### Quick SSL with Let's Encrypt

```bash
# 1. Get certificates
sudo certbot --nginx -d yourdomain.com

# 2. Certbot automatically updates nginx config

# 3. Restart
docker-compose restart nginx
```

See `NGINX_PROXY.md` for detailed SSL setup.

---

## Common Commands

```bash
# Start (default - nginx proxy)
docker-compose up

# Start (development - direct ports)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# View nginx logs
docker-compose logs nginx

# Test nginx config
docker-compose exec nginx nginx -t

# Reload nginx config
docker-compose exec nginx nginx -s reload
```

---

## Troubleshooting

### Can't Access on Port 80

**Try:**
```bash
# Use port 8080 instead
# Edit docker-compose.yml:
nginx:
  ports:
    - "8080:80"
```

### 502 Bad Gateway

**Means:** Backend or frontend not responding

**Fix:**
```bash
docker-compose ps
docker-compose logs backend
docker-compose logs frontend
docker-compose restart
```

### WebSocket Not Working

**Check:**
1. Using `ws://localhost/ws` (not `ws://localhost:3001`)
2. Nginx config has WebSocket support (already configured)
3. Check nginx logs: `docker-compose logs nginx`

---

## Documentation

- **NGINX_PROXY.md** - Complete nginx documentation
- **README.md** - Updated with proxy info
- **QUICK_REFERENCE.md** - Quick URL reference
- **TROUBLESHOOTING.md** - Common issues

---

## Summary

🎯 **Everything now goes through port 80**
🔒 **Backend and frontend are internal only**
⚡ **Production-ready architecture**
📚 **Full documentation included**

Access your app at: **http://localhost/**
