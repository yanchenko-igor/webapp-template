# Frontend Health Check Troubleshooting

## Issue: "dependency frontend failed to start"

This error means the frontend container's health check is failing.

### Health Check Details

The frontend container runs this health check:
```bash
wget --no-verbose --tries=1 --spider http://localhost:8080/health
```

This checks if nginx inside the frontend container is serving the `/health` endpoint on port 8080.

## Quick Fix

### 1. Rebuild with No Cache

```bash
docker-compose down
docker-compose build --no-cache frontend
docker-compose up
```

### 2. Check What's Wrong

```bash
# Check if frontend container is running
docker-compose ps

# Check frontend logs
docker-compose logs frontend

# Try to access the container
docker-compose up -d frontend
docker-compose exec frontend sh

# Inside container:
# Check if nginx is running
ps aux | grep nginx

# Check if port 8080 is listening
netstat -tulpn | grep 8080

# Test health endpoint manually
wget -O- http://localhost:8080/health
# Should return: healthy

# Check nginx config
nginx -t

# Check if files exist
ls -la /usr/share/nginx/html

# Exit container
exit
```

## Common Causes & Solutions

### Cause 1: wget not installed

**Symptom**: Health check fails immediately

**Fix**: Already fixed in Dockerfile
```dockerfile
RUN apk add --no-cache wget
```

### Cause 2: Build Failed

**Symptom**: No files in `/usr/share/nginx/html`

**Fix**:
```bash
# Check build logs
docker-compose build frontend

# If React build fails, check package-lock.json exists
ls frontend/package-lock.json

# Regenerate if missing
cd frontend
npm install
cd ..
```

### Cause 3: Nginx Not Starting

**Symptom**: Container exits immediately

**Fix**:
```bash
# Check nginx config syntax
docker-compose run --rm frontend nginx -t

# Check logs for errors
docker-compose logs frontend
```

### Cause 4: Wrong Port

**Symptom**: Health check tries wrong port

**Verify**:
- Dockerfile: `EXPOSE 8080`
- nginx.conf: `listen 8080;`
- Health check: `http://localhost:8080/health`

### Cause 5: Health Endpoint Not Configured

**Fix**: Verify `frontend/nginx.conf` has:
```nginx
location /health {
    access_log off;
    return 200 "healthy\n";
    add_header Content-Type text/plain;
}
```

## Manual Health Check Test

```bash
# Start frontend without health check dependency
docker-compose up -d backend
docker-compose up -d frontend

# Wait 10 seconds
sleep 10

# Test health check manually
docker-compose exec frontend wget -O- http://localhost:8080/health

# Should output: healthy
```

## Alternative: Disable Health Check Temporarily

Edit `docker-compose.yml`:

```yaml
frontend:
  # Comment out health check
  # healthcheck:
  #   test: ["CMD", "wget", ...]
```

Then:
```bash
docker-compose up
```

**Note**: Not recommended for production!

## Check Build Output

The React build should create these files:

```
/usr/share/nginx/html/
├── index.html          ← Must exist
├── static/
│   ├── css/
│   └── js/
└── asset-manifest.json
```

Verify:
```bash
docker-compose run --rm frontend ls -la /usr/share/nginx/html
```

## Increased Start Period

The health check now waits 40 seconds before checking (in docker-compose.yml):

```yaml
healthcheck:
  start_period: 40s  # Wait 40s for container to start
  interval: 30s       # Check every 30s
  timeout: 3s         # Timeout after 3s
  retries: 3          # Try 3 times
```

## Full Diagnostic Script

```bash
#!/bin/bash

echo "=== Frontend Diagnostic ==="

echo -e "\n1. Container Status:"
docker-compose ps frontend

echo -e "\n2. Recent Logs:"
docker-compose logs --tail=20 frontend

echo -e "\n3. Test Health Endpoint:"
docker-compose exec frontend wget -q -O- http://localhost:8080/health 2>&1

echo -e "\n4. Check Nginx Config:"
docker-compose exec frontend nginx -t 2>&1

echo -e "\n5. Check Files:"
docker-compose exec frontend ls -la /usr/share/nginx/html 2>&1 | head -10

echo -e "\n6. Check Process:"
docker-compose exec frontend ps aux | grep nginx

echo -e "\n7. Check Port:"
docker-compose exec frontend netstat -tulpn | grep 8080 2>&1
```

Save as `debug-frontend.sh` and run!

## Expected Output (Healthy)

```
✓ Container is Up
✓ Nginx config OK
✓ Health endpoint returns: healthy
✓ Files exist in /usr/share/nginx/html
✓ Nginx process running
✓ Port 8080 listening
```

## If Still Failing

1. **Check the actual error**:
   ```bash
   docker-compose logs frontend | tail -50
   ```

2. **Start manually and test**:
   ```bash
   docker-compose run --rm frontend sh
   # Inside container:
   nginx -g "daemon off;" &
   sleep 5
   wget -O- http://localhost:8080/health
   ```

3. **Rebuild everything**:
   ```bash
   docker-compose down -v
   docker-compose build --no-cache
   docker-compose up
   ```

4. **Check for port conflicts**:
   ```bash
   # On host machine
   lsof -i :8080
   ```

## Summary

The frontend health check failing is usually due to:
1. ❌ Missing wget (fixed in Dockerfile)
2. ❌ Build failed (check package-lock.json)
3. ❌ Nginx config error (run nginx -t)
4. ❌ Wrong port (should be 8080)
5. ❌ Files not copied (check build stage)

Most common fix:
```bash
docker-compose down
docker-compose build --no-cache frontend
docker-compose up
```
