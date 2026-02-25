# Debugging Nginx 404 Error

## Problem: Getting 404 when accessing the frontend

### Check Port Mapping

The docker-compose.yml maps ports as: **`3000:8080`**

This means:
- **Host (your computer)**: port 3000
- **Container (inside Docker)**: port 8080

**Correct URLs to access:**
- ✅ http://localhost:3000
- ✅ http://127.0.0.1:3000
- ❌ http://localhost:8080 (This will fail - port not exposed)
- ❌ http://127.0.0.1:8080 (This will fail - port not exposed)

### If You Want to Access on Port 8080

Edit `docker-compose.yml`:

```yaml
frontend:
  ports:
    - "8080:8080"  # Changed from "3000:8080"
```

Then rebuild:
```bash
docker-compose down
docker-compose up --build
```

Now you can access: http://localhost:8080

---

## Debugging Steps

### Step 1: Check if Container is Running

```bash
docker-compose ps
```

You should see:
```
NAME                IMAGE              STATUS
webapp-frontend     ...                Up (healthy)
webapp-backend      ...                Up (healthy)
```

### Step 2: Check Container Logs

```bash
docker-compose logs frontend
```

Look for errors. You should see nginx starting successfully.

### Step 3: Check Inside the Container

```bash
# Access the container
docker exec -it webapp-frontend sh

# Check if files exist
ls -la /usr/share/nginx/html

# You should see:
# index.html
# static/
# asset-manifest.json
# etc.

# Test nginx config
nginx -t

# Exit container
exit
```

### Step 4: Test Health Endpoint

```bash
# This should work if nginx is running
curl http://localhost:3000/health
```

Expected response: `healthy`

### Step 5: Check Build Output

```bash
# Check if React app built successfully
docker-compose logs frontend | grep -i "build"
docker-compose logs frontend | grep -i "error"
```

---

## Common Issues and Fixes

### Issue 1: Files Not in Container

**Symptom:** `ls /usr/share/nginx/html` shows empty or missing files

**Cause:** React build failed or files weren't copied

**Fix:**
```bash
# Rebuild without cache
docker-compose build --no-cache frontend
docker-compose up frontend
```

### Issue 2: Permission Denied

**Symptom:** Nginx logs show permission errors

**Cause:** Non-root user can't access files

**Fix:** Already fixed in the updated Dockerfile (removed non-root user)

### Issue 3: Wrong Port

**Symptom:** Connection refused

**Cause:** Accessing wrong port

**Fix:** Use port 3000, not 8080:
```bash
curl http://localhost:3000
```

### Issue 4: Nginx Not Starting

**Symptom:** Container exits immediately

**Check logs:**
```bash
docker-compose logs frontend
```

**Fix:** Check nginx.conf for syntax errors:
```bash
docker exec -it webapp-frontend nginx -t
```

---

## Quick Test Commands

```bash
# 1. Check what's running
docker-compose ps

# 2. Check frontend logs
docker-compose logs -f frontend

# 3. Test health endpoint (on correct port)
curl http://localhost:3000/health

# 4. Test main page (on correct port)
curl http://localhost:3000/

# 5. Check inside container
docker exec -it webapp-frontend ls -la /usr/share/nginx/html

# 6. Check nginx config
docker exec -it webapp-frontend nginx -t
```

---

## Complete Reset and Rebuild

If nothing works:

```bash
# Stop everything
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Clear build cache
docker system prune -f

# Rebuild from scratch
docker-compose build --no-cache

# Start
docker-compose up

# Access on port 3000
open http://localhost:3000
```

---

## Verify Build Output

The React build should create these files:

```
/usr/share/nginx/html/
├── index.html
├── favicon.ico
├── manifest.json
├── robots.txt
├── asset-manifest.json
├── static/
│   ├── css/
│   ├── js/
│   └── media/
```

Check with:
```bash
docker exec -it webapp-frontend find /usr/share/nginx/html -type f
```

---

## Access Matrix

| URL | Works? | Why |
|-----|--------|-----|
| http://localhost:3000 | ✅ Yes | Correct port mapping |
| http://127.0.0.1:3000 | ✅ Yes | Same as above |
| http://localhost:8080 | ❌ No | Port not exposed to host |
| http://127.0.0.1:8080 | ❌ No | Port not exposed to host |
| Inside container: http://localhost:8080 | ✅ Yes | Nginx listens on 8080 internally |

---

## Still Getting 404?

1. **Verify you're using the RIGHT PORT** (3000, not 8080)
2. **Check nginx logs** for specific error messages
3. **Verify files exist** in the container
4. **Try rebuilding** without cache
5. **Check firewall** isn't blocking port 3000

Run this diagnostic:
```bash
# Full diagnostic
echo "=== Container Status ==="
docker-compose ps

echo -e "\n=== Frontend Logs ==="
docker-compose logs --tail=20 frontend

echo -e "\n=== Health Check ==="
curl -v http://localhost:3000/health

echo -e "\n=== Files in Container ==="
docker exec webapp-frontend ls -la /usr/share/nginx/html

echo -e "\n=== Nginx Config Test ==="
docker exec webapp-frontend nginx -t

echo -e "\n=== Port Mapping ==="
docker port webapp-frontend
```

Save this as `debug.sh` and run it!
