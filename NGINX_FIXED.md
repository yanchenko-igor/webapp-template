# Nginx Configuration - Fixed Setup

## What Was Wrong

The previous nginx configuration had issues with:
1. WebSocket routing wasn't working correctly
2. Frontend health check path confusion
3. Environment variables pointing to wrong locations

## Current Setup (Fixed)

### URL Routing

| Request Type | URL | Routes To | Notes |
|--------------|-----|-----------|-------|
| API Calls | `/api/*` | Backend (3001) | REST API endpoints |
| Health Check | `/health` | Backend (3001) | Main health endpoint |
| Frontend Health | `/health/frontend` | Frontend (8080) | For monitoring |
| WebSocket | `/` (with upgrade header) | Backend (3001) | Detects WebSocket upgrade |
| Static Files | `/`, `/static/*` | Frontend (8080) | React app and assets |

### How WebSocket Works

1. Frontend JavaScript connects to `ws://localhost/` (or dynamically to current host)
2. Nginx detects the `Upgrade: websocket` header
3. Nginx routes the connection to backend (port 3001)
4. Backend WebSocket server handles the connection

### Frontend Configuration

The frontend uses relative URLs and dynamic WebSocket URL:

```javascript
// In App.js
const API_URL = process.env.REACT_APP_API_URL || '/api';
const WS_URL = process.env.REACT_APP_WS_URL || 
  `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
```

This means:
- **API calls**: Go to `/api/messages` (nginx routes to backend)
- **WebSocket**: Connects to current host with ws:// or wss://

### Environment Variables

In `docker-compose.yml`:

```yaml
frontend:
  environment:
    - REACT_APP_API_URL=/api
    - REACT_APP_WS_URL=   # Empty = use dynamic URL
```

### Health Checks

**Backend health check:**
```bash
docker-compose exec backend wget -O- http://localhost:3001/health
# or via nginx:
curl http://localhost/health
```

**Frontend health check:**
```bash
docker-compose exec frontend wget -O- http://localhost:8080/health
# or via nginx:
curl http://localhost/health/frontend
```

## Architecture

```
Browser
  │
  ├─ GET /              → Nginx → Frontend (React app)
  ├─ GET /api/messages  → Nginx → Backend (REST API)
  ├─ GET /health        → Nginx → Backend
  └─ WS  / (upgrade)    → Nginx → Backend (WebSocket)
```

## Testing

### Test API
```bash
curl http://localhost/api/messages
```

### Test Health
```bash
curl http://localhost/health
```

### Test Frontend
```bash
curl http://localhost/
# Should return HTML
```

### Test WebSocket
Use the browser dev tools:
1. Open http://localhost/
2. Open dev console
3. Check Network tab → WS
4. Should see WebSocket connection established

## Troubleshooting

### 502 Bad Gateway on /

**Cause**: Frontend container not responding

**Check**:
```bash
docker-compose ps frontend
docker-compose logs frontend
docker-compose exec frontend wget -O- http://localhost:8080/
```

### WebSocket Connection Failed

**Cause**: Nginx not properly detecting upgrade

**Check nginx logs**:
```bash
docker-compose logs nginx | grep -i upgrade
```

**Verify nginx config**:
```bash
docker-compose exec nginx nginx -t
```

### API 404 Errors

**Cause**: Wrong API URL in frontend

**Check**:
```bash
docker-compose exec frontend env | grep REACT_APP
# Should show: REACT_APP_API_URL=/api
```

### Health Check Failing

**For backend**:
```bash
# Direct check
docker-compose exec backend wget -O- http://localhost:3001/health

# Via nginx
curl http://localhost/health
```

**For frontend**:
```bash
# Direct check  
docker-compose exec frontend wget -O- http://localhost:8080/health

# Via nginx
curl http://localhost/health/frontend
```

## Complete Test Suite

Run this to test everything:

```bash
#!/bin/bash

echo "=== Testing Backend Health ==="
curl -s http://localhost/health && echo "✓ Backend healthy" || echo "✗ Backend failed"

echo -e "\n=== Testing Frontend (via nginx) ==="
curl -s http://localhost/ | grep -q "<title>" && echo "✓ Frontend serving" || echo "✗ Frontend failed"

echo -e "\n=== Testing API ==="
curl -s http://localhost/api/messages | grep -q "messages" && echo "✓ API responding" || echo "✗ API failed"

echo -e "\n=== Testing Frontend Health (direct) ==="
docker-compose exec -T frontend wget -q -O- http://localhost:8080/health && echo "✓ Frontend health OK" || echo "✗ Frontend health failed"

echo -e "\n=== Testing Backend Health (direct) ==="
docker-compose exec -T backend node -e "require('http').get('http://localhost:3001/health', r => console.log('✓ Backend direct health OK'))"

echo -e "\n=== Container Status ==="
docker-compose ps
```

Save as `test-all.sh`, make executable, and run!

## Summary

✅ All routing through nginx on port 80
✅ WebSocket properly detected and routed to backend  
✅ Frontend and backend health checks work
✅ API calls properly routed
✅ Static files served from frontend
✅ Relative URLs used for portability
