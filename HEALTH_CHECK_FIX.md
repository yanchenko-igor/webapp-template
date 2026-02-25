# Frontend Health Check - Fix Summary

## Problem

```
✘ Container webapp-frontend Error dependency frontend failed to start
dependency failed to start: container webapp-frontend is unhealthy
```

## Root Cause

The `wget` command wasn't installed in the nginx:alpine image used by the frontend container, causing the health check to fail.

## What I Fixed

### 1. Added wget to Frontend Dockerfile

```dockerfile
# Stage 2: Production with nginx
FROM nginx:alpine AS production

# Install wget for health checks
RUN apk add --no-cache wget

# ... rest of configuration
```

### 2. Increased Health Check Start Period

```yaml
# docker-compose.yml
frontend:
  healthcheck:
    start_period: 40s  # Increased from 10s to 40s
```

This gives the container more time to build and start before health checks begin.

### 3. Added Debug Tools

- **debug-frontend.sh** - Diagnostic script to check all aspects of frontend container
- **FRONTEND_HEALTH_DEBUG.md** - Complete troubleshooting guide
- **Makefile targets** - `make debug-frontend` and `make rebuild-frontend`

## How to Fix Your Installation

### Option 1: Rebuild (Recommended)

```bash
docker-compose down
docker-compose build --no-cache frontend
docker-compose up
```

### Option 2: Quick Rebuild

```bash
make rebuild-frontend
```

### Option 3: Debug First

```bash
make debug-frontend
```

This will show you exactly what's wrong.

## Verification

After rebuilding, the health check should pass:

```bash
docker-compose ps

# Should show:
# NAME              STATUS
# webapp-frontend   Up (healthy)
# webapp-backend    Up (healthy)
# webapp-nginx      Up (healthy)
```

## Testing Health Check Manually

```bash
# Inside container
docker-compose exec frontend wget -O- http://localhost:8080/health

# Should output: healthy
```

## What the Health Check Does

```bash
wget --no-verbose --tries=1 --spider http://localhost:8080/health
```

This checks if nginx inside the frontend container is:
1. Running
2. Listening on port 8080
3. Serving the `/health` endpoint
4. Returning a successful response

## Timeline

- **Every 30s**: Health check runs
- **3s timeout**: Health check must complete in 3 seconds
- **3 retries**: If it fails, try 3 times
- **40s start period**: Wait 40 seconds before first check

## Common Issues

### Issue 1: wget not found
**Symptom**: Health check fails immediately
**Fix**: Rebuild with `--no-cache`

### Issue 2: Build failed
**Symptom**: No files in container
**Fix**: Make sure `package-lock.json` exists in frontend/

```bash
cd frontend
npm install
cd ..
docker-compose build --no-cache frontend
```

### Issue 3: Port conflict
**Symptom**: Container won't start
**Fix**: Check if port 8080 is free

```bash
lsof -i :8080
```

## Files Changed

1. **frontend/Dockerfile** - Added `RUN apk add --no-cache wget`
2. **docker-compose.yml** - Increased `start_period: 40s`
3. **debug-frontend.sh** - New diagnostic script
4. **FRONTEND_HEALTH_DEBUG.md** - New troubleshooting guide
5. **Makefile** - Added `debug-frontend` and `rebuild-frontend` targets
6. **README.md** - Added troubleshooting section

## Expected Behavior After Fix

```bash
$ docker-compose up

[+] Running 3/3
 ✔ Container webapp-backend   Healthy    
 ✔ Container webapp-frontend  Healthy    <- This should now be healthy
 ✔ Container webapp-nginx     Started
```

## Still Having Issues?

Run the diagnostic:
```bash
./debug-frontend.sh
```

It will check:
1. ✓ Container status
2. ✓ Recent logs
3. ✓ Health endpoint response
4. ✓ Nginx configuration
5. ✓ Files exist
6. ✓ Nginx process running
7. ✓ Port 8080 listening

And provide specific recommendations.

## Prevention

The template now includes:
- ✅ wget pre-installed
- ✅ Longer health check start period
- ✅ Debug tools included
- ✅ Documentation for common issues

You shouldn't see this error again after rebuilding!
