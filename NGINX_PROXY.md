# Nginx Reverse Proxy Setup

This application uses nginx as a reverse proxy to route all traffic through a single port (80).

## Architecture

```
                    ┌─────────────────────────┐
                    │   Browser / Client      │
                    └────────────┬────────────┘
                                 │
                                 │ Port 80
                                 │
                    ┌────────────▼────────────┐
                    │   Nginx Reverse Proxy   │
                    │      (Port 80)          │
                    └────────┬────────┬───────┘
                             │        │
                ┌────────────▼─────┐  │
                │                  │  │
         /api/* │  /, /static/*   │  │ WebSocket /ws
                │                  │  │
    ┌───────────▼──────┐  ┌────────▼─────────┐
    │   Backend        │  │   Frontend       │
    │   (Port 3001)    │  │   (Port 8080)    │
    │   Internal only  │  │   Internal only  │
    └──────────────────┘  └──────────────────┘
```

## URL Routing

### External Access (Port 80)

| URL Pattern | Routed To | Description |
|-------------|-----------|-------------|
| `http://localhost/` | Frontend (8080) | React app |
| `http://localhost/api/*` | Backend (3001) | REST API endpoints |
| `http://localhost/health` | Backend (3001) | Health check |
| `http://localhost/ws` | Backend (3001) | WebSocket connection |

### Internal Ports (Not exposed externally)

- **Backend**: Port 3001 (only accessible within Docker network)
- **Frontend**: Port 8080 (only accessible within Docker network)

## Benefits

✅ **Single entry point** - All traffic through port 80
✅ **Security** - Backend and frontend not directly exposed
✅ **SSL/TLS ready** - Easy to add HTTPS with Let's Encrypt
✅ **Load balancing** - Can add multiple backend/frontend instances
✅ **Caching** - Nginx can cache static assets
✅ **Production-ready** - Standard deployment pattern

## Usage

### Start with Nginx Proxy (Default)

```bash
docker-compose up
```

Access everything on **port 80**:
- Frontend: http://localhost/
- API: http://localhost/api/messages
- Health: http://localhost/health

### Development Mode (Direct Port Access)

For debugging, you can expose ports directly:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

This exposes:
- Nginx: http://localhost:8080
- Frontend: http://localhost:3000 (direct)
- Backend: http://localhost:3001 (direct)

## Configuration

### Nginx Config Location

`nginx/nginx.conf` - Main reverse proxy configuration

### Key Configuration Sections

#### Frontend Routing
```nginx
location / {
    proxy_pass http://frontend;
    # ... headers
}
```

#### API Routing
```nginx
location /api {
    proxy_pass http://backend;
    # ... headers
}
```

#### WebSocket Support
```nginx
location /ws {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    # ... WebSocket settings
}
```

## Frontend Configuration

The frontend must use relative URLs or the nginx proxy URLs:

```javascript
// In frontend/src/App.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost/api';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost/ws';
```

## Docker Compose Configuration

### Main (docker-compose.yml)

```yaml
services:
  nginx:
    ports:
      - "80:80"    # Only nginx exposed externally
  
  backend:
    expose:
      - "3001"     # Internal only (not ports)
  
  frontend:
    expose:
      - "8080"     # Internal only (not ports)
```

## Adding HTTPS/SSL

### Option 1: Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Certbot will automatically update nginx.conf
```

### Option 2: Manual SSL Certificate

Update `nginx/nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # ... rest of configuration
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

Mount SSL certificates in docker-compose.yml:

```yaml
nginx:
  volumes:
    - ./ssl:/etc/nginx/ssl:ro
```

## Load Balancing Multiple Instances

Scale backend or frontend:

```nginx
upstream backend {
    server backend1:3001;
    server backend2:3001;
    server backend3:3001;
}
```

Then in docker-compose.yml:

```bash
docker-compose up --scale backend=3
```

## Caching Static Assets

Already configured in nginx.conf:

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg)$ {
    proxy_pass http://frontend;
    proxy_cache_valid 200 1y;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Custom Domain Setup

1. **Update nginx.conf**:
```nginx
server_name yourdomain.com www.yourdomain.com;
```

2. **Point DNS to your server**:
```
A Record: yourdomain.com → Your-Server-IP
CNAME: www → yourdomain.com
```

3. **Add SSL**:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Monitoring and Logs

### View Nginx Logs

```bash
# Access logs
docker-compose logs nginx

# Follow logs
docker-compose logs -f nginx

# Inside container
docker exec webapp-nginx cat /var/log/nginx/access.log
docker exec webapp-nginx cat /var/log/nginx/error.log
```

### Health Checks

```bash
# Overall health (via nginx)
curl http://localhost/health

# Individual services (in development mode)
curl http://localhost:3001/health  # Backend
curl http://localhost:3000/health  # Frontend
```

## Troubleshooting

### 502 Bad Gateway

**Cause**: Backend or frontend not responding

**Fix**:
```bash
# Check if services are running
docker-compose ps

# Check backend/frontend logs
docker-compose logs backend
docker-compose logs frontend

# Restart services
docker-compose restart backend frontend
```

### WebSocket Connection Failed

**Cause**: WebSocket not properly proxied

**Check**:
1. nginx.conf has WebSocket support (already configured)
2. Frontend uses correct WS URL: `ws://localhost/ws`
3. Check nginx logs for connection upgrade errors

### 404 on API Endpoints

**Cause**: Wrong API URL in frontend

**Fix**:
```bash
# Check frontend environment
docker-compose exec frontend env | grep REACT_APP

# Should be:
# REACT_APP_API_URL=http://localhost/api
```

### Can't Access on Port 80 (Permission Denied)

**Cause**: Port 80 requires root on some systems

**Fix**:
```bash
# Option 1: Use port 8080 instead
# Edit docker-compose.yml:
nginx:
  ports:
    - "8080:80"

# Option 2: Run with sudo (not recommended)
sudo docker-compose up
```

## Security Best Practices

✅ Rate limiting (add to nginx.conf):
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api {
    limit_req zone=api burst=20;
    # ... rest of config
}
```

✅ Hide nginx version:
```nginx
http {
    server_tokens off;
}
```

✅ Add security headers (already configured)

✅ Enable HTTPS in production (see SSL section above)

## Performance Tuning

### Enable Gzip (already configured)
```nginx
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json;
```

### Increase buffer sizes for large payloads
```nginx
client_max_body_size 10M;
client_body_buffer_size 128k;
```

### Connection pooling to backend
```nginx
upstream backend {
    server backend:3001;
    keepalive 32;
}
```

## Migration from Direct Ports

If you were using direct port access (3000, 3001), migrate to nginx:

### Old Setup
```
Frontend: http://localhost:3000
Backend: http://localhost:3001/api/messages
```

### New Setup  
```
Everything: http://localhost/
API: http://localhost/api/messages
```

### Update Frontend Code
Change:
```javascript
const API_URL = 'http://localhost:3001';
```

To:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost/api';
```

---

## Summary

- **All traffic** goes through nginx on **port 80**
- **Backend and frontend** are internal only (ports 3001, 8080)
- **Production ready** with SSL, caching, and security headers
- **Easy to scale** and add more instances
- **Development mode** available with direct port access

For more help, see:
- `TROUBLESHOOTING.md`
- `README.md`
- Nginx logs: `docker-compose logs nginx`
