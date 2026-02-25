# Troubleshooting Guide

## Docker Build Errors

### Error: "Nginx returns 404 on http://localhost:8080"

**Problem:** You're accessing the wrong port. The frontend is exposed on port 3000, not 8080.

**Understanding Port Mapping:**
```yaml
ports:
  - "3000:8080"  # Host:Container
```
- **3000** = Port on your computer (host)
- **8080** = Port inside Docker container

**Solution:**

Access the frontend on the correct port:
```bash
# ✅ Correct
http://localhost:3000
http://127.0.0.1:3000

# ❌ Wrong (will give connection refused or 404)
http://localhost:8080
http://127.0.0.1:8080
```

**Want to use port 8080 instead?**

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

**Diagnostic script:**
```bash
./diagnose.sh
```

**See also:** `DEBUG_NGINX.md` for detailed troubleshooting.

---

### Error: "npm ci can only install with an existing package-lock.json"

**Problem:** The Dockerfiles need `package-lock.json` files to build, but they're not included in the template.

**Solution:**

```bash
# Generate lock files before building
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Now Docker build will work
docker-compose build
```

**Why this happens:** 
- The template doesn't include `package-lock.json` files to keep it clean
- Docker needs these files to ensure reproducible builds
- Running `npm install` locally generates them

**Permanent fix:**
```bash
# Commit the lock files to your repository
git add backend/package-lock.json frontend/package-lock.json
git commit -m "Add package-lock.json files"
```

---

### Error: "Port already in use"

**Problem:** Ports 3000 or 3001 are already being used by another process.

**Solution 1 - Stop the other process:**
```bash
# Find what's using the port
lsof -i :3001  # or :3000
# Kill the process
kill -9 <PID>
```

**Solution 2 - Change ports:**
```bash
# Edit .env file
PORT=3002  # Backend

# Edit docker-compose.yml for frontend
# Change "3000:8080" to "3002:8080"
```

---

### Error: "Cannot connect to Docker daemon"

**Problem:** Docker isn't running or you don't have permissions.

**Solution:**
```bash
# Start Docker Desktop (on Mac/Windows)
# Or start Docker service (on Linux)
sudo systemctl start docker

# Add your user to docker group (Linux)
sudo usermod -aG docker $USER
# Then log out and back in
```

---

### Error: "COPY failed: no source files"

**Problem:** Docker can't find the files to copy.

**Solution:**
```bash
# Make sure you're in the project root
cd webapp-template

# Build from the root directory
docker-compose build

# Or specify the correct context
docker build -t backend ./backend
```

---

### Error: "npm WARN using --force"

**Problem:** Dependency conflicts or version mismatches.

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and lock files
rm -rf backend/node_modules backend/package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json

# Reinstall
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

---

### Error: "Health check failed"

**Problem:** Container started but health check endpoint isn't responding.

**Solution:**
```bash
# Check container logs
docker-compose logs backend
docker-compose logs frontend

# Check if containers are running
docker-compose ps

# Test health endpoints manually
curl http://localhost:3001/health
curl http://localhost:3000/health
```

---

## Node.js / npm Errors

### Error: "Module not found"

**Problem:** Dependencies aren't installed.

**Solution:**
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

### Error: "Permission denied" on setup.sh

**Problem:** Setup script doesn't have execute permissions.

**Solution:**
```bash
chmod +x setup.sh
./setup.sh
```

---

## GitHub Actions Errors

### Error: "refused to allow access to package"

**Problem:** GitHub Actions doesn't have permission to push to Container Registry.

**Solution:**
1. Go to repo Settings → Actions → General
2. Under "Workflow permissions", select "Read and write permissions"
3. Save

---

### Error: "No space left on device"

**Problem:** GitHub Actions runner ran out of disk space.

**Solution:**
Add cleanup step to workflow:
```yaml
- name: Free up space
  run: |
    docker system prune -af
    df -h
```

---

## WebSocket Connection Issues

### Error: "WebSocket connection failed"

**Problem:** Frontend can't connect to backend WebSocket.

**Solution:**
```bash
# Check backend is running
curl http://localhost:3001/health

# Check WebSocket URL in frontend
# Should be: ws://localhost:3001 (development)

# Check CORS settings in backend
# Already configured correctly in template
```

---

## Quick Fixes

### Complete Fresh Start

```bash
# Stop everything
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Clear node_modules
rm -rf backend/node_modules frontend/node_modules
rm -rf backend/package-lock.json frontend/package-lock.json

# Start fresh
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
docker-compose build --no-cache
docker-compose up
```

---

### Docker Build Taking Too Long

```bash
# Use BuildKit for faster builds
export DOCKER_BUILDKIT=1
docker-compose build

# Or add to docker-compose.yml:
# COMPOSE_DOCKER_CLI_BUILD=1
# DOCKER_BUILDKIT=1
```

---

### Can't Access Application in Browser

**Checklist:**
1. ✅ Docker containers running: `docker-compose ps`
2. ✅ Ports mapped correctly: Check `docker-compose.yml`
3. ✅ No firewall blocking: `curl http://localhost:3000`
4. ✅ Using correct URL: `http://localhost:3000` (not https)

---

## Getting Help

If you're still stuck:

1. **Check logs:**
   ```bash
   docker-compose logs -f
   ```

2. **Verify setup:**
   ```bash
   docker-compose ps
   docker-compose config
   ```

3. **Test components individually:**
   ```bash
   # Backend only
   cd backend && npm run dev
   
   # Frontend only  
   cd frontend && npm start
   ```

4. **Create an issue:**
   - Include error messages
   - Include logs
   - Describe what you tried
   - Include your environment (OS, Docker version, Node version)

---

## Prevention Tips

✅ **Always commit package-lock.json files**
✅ **Use Docker for consistent environment**
✅ **Run tests before pushing**
✅ **Keep Docker images updated**
✅ **Read error messages carefully**
