# Deployment Guide

This guide covers different deployment scenarios for the web application.

## Table of Contents

1. [Local Development](#local-development)
2. [GitHub Actions Setup](#github-actions-setup)
3. [Production Deployment](#production-deployment)
4. [Cloud Platforms](#cloud-platforms)

## Local Development

### Using Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Or use make
make build
make up

# View logs
make logs
```

### Without Docker

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

## GitHub Actions Setup

### 1. Enable GitHub Packages

The workflows are configured to push Docker images to GitHub Container Registry (ghcr.io).

1. Go to your repository Settings
2. Navigate to Actions > General
3. Under "Workflow permissions", select "Read and write permissions"
4. Save

### 2. Repository Secrets

No additional secrets are required! The workflows use the automatic `GITHUB_TOKEN`.

### 3. Workflow Triggers

Workflows automatically run on:
- **Pull Requests**: Runs tests and builds (doesn't push images)
- **Push to main/develop**: Runs tests, builds, and pushes images

### 4. Manual Workflow Dispatch

You can also trigger workflows manually from the Actions tab.

## Production Deployment

### Using Docker Compose

#### 1. Pull Latest Images

```bash
# Set your GitHub repository
export GITHUB_REPOSITORY=username/repo

# Pull images
docker pull ghcr.io/${GITHUB_REPOSITORY}-backend:latest
docker pull ghcr.io/${GITHUB_REPOSITORY}-frontend:latest
```

#### 2. Configure Environment

Create a `.env` file:

```env
GITHUB_REPOSITORY=username/repo
API_URL=https://api.yourdomain.com
WS_URL=wss://api.yourdomain.com
```

#### 3. Deploy

```bash
docker-compose -f docker-compose.prod.yml up -d

# Or use make
make prod-up
```

### Using Individual Containers

```bash
# Backend
docker run -d \
  --name webapp-backend \
  -p 3001:3001 \
  -e NODE_ENV=production \
  ghcr.io/username/repo-backend:latest

# Frontend
docker run -d \
  --name webapp-frontend \
  -p 80:8080 \
  -e REACT_APP_API_URL=http://your-backend:3001 \
  -e REACT_APP_WS_URL=ws://your-backend:3001 \
  ghcr.io/username/repo-frontend:latest
```

## Cloud Platforms

### AWS (ECS/Fargate)

#### 1. Push to ECR (Optional)

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag ghcr.io/username/repo-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/webapp-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/webapp-backend:latest
```

#### 2. Create Task Definitions

Create task definitions for backend and frontend services using the ECS console or CLI.

#### 3. Create Services

Create ECS services with Application Load Balancer.

### Google Cloud (Cloud Run)

```bash
# Backend
gcloud run deploy webapp-backend \
  --image ghcr.io/username/repo-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Frontend
gcloud run deploy webapp-frontend \
  --image ghcr.io/username/repo-frontend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars REACT_APP_API_URL=https://webapp-backend-xxx.run.app
```

### Azure (Container Instances)

```bash
# Backend
az container create \
  --resource-group myResourceGroup \
  --name webapp-backend \
  --image ghcr.io/username/repo-backend:latest \
  --dns-name-label webapp-backend-unique \
  --ports 3001

# Frontend
az container create \
  --resource-group myResourceGroup \
  --name webapp-frontend \
  --image ghcr.io/username/repo-frontend:latest \
  --dns-name-label webapp-frontend-unique \
  --ports 8080 \
  --environment-variables REACT_APP_API_URL=http://webapp-backend-unique.region.azurecontainer.io:3001
```

### DigitalOcean (App Platform)

1. Fork/clone the repository
2. Go to DigitalOcean App Platform
3. Create new app from GitHub
4. Add both services:
   - Backend: Dockerfile path `backend/Dockerfile`
   - Frontend: Dockerfile path `frontend/Dockerfile`
5. Configure environment variables
6. Deploy

### Kubernetes

Create Kubernetes manifests:

```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapp-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: webapp-backend
  template:
    metadata:
      labels:
        app: webapp-backend
    spec:
      containers:
      - name: backend
        image: ghcr.io/username/repo-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
---
apiVersion: v1
kind: Service
metadata:
  name: webapp-backend
spec:
  selector:
    app: webapp-backend
  ports:
  - port: 3001
    targetPort: 3001
```

Deploy:

```bash
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml
```

## Monitoring & Logging

### Docker Logs

```bash
# View logs
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### Health Checks

- Backend: `http://your-backend:3001/health`
- Frontend: `http://your-frontend:8080/health`

### Metrics

Add monitoring tools:
- Prometheus + Grafana
- DataDog
- New Relic
- AWS CloudWatch

## Scaling

### Horizontal Scaling

```bash
# Scale with docker-compose
docker-compose up --scale backend=3 --scale frontend=2

# Kubernetes
kubectl scale deployment webapp-backend --replicas=5
```

### Load Balancing

Use a load balancer:
- Nginx
- HAProxy
- Cloud provider load balancers (ALB, Cloud Load Balancer)

## SSL/TLS

### Let's Encrypt with Nginx

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Cloudflare

Use Cloudflare for automatic SSL/TLS.

## Backup & Recovery

### Database Backups

If you add a database later:

```bash
# MongoDB
docker exec mongodb mongodump --out /backup

# PostgreSQL
docker exec postgres pg_dump -U user dbname > backup.sql
```

### Volume Backups

```bash
docker run --rm -v webapp_data:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz -C /data .
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs backend

# Inspect container
docker inspect webapp-backend
```

### Network issues

```bash
# Check network
docker network ls
docker network inspect webapp-network
```

### Port conflicts

```bash
# Check what's using the port
sudo lsof -i :3001
```

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Use non-root users** - Already configured in Dockerfiles
3. **Keep images updated** - Regularly rebuild with latest base images
4. **Enable HTTPS** - Use SSL/TLS in production
5. **Limit network exposure** - Use firewalls and security groups
6. **Regular security scans** - Use tools like Snyk or Trivy

## Performance Optimization

1. **Enable caching** - Use CDN for static assets
2. **Compress responses** - Gzip enabled in nginx config
3. **Use connection pooling** - For database connections
4. **Implement rate limiting** - Protect APIs from abuse
5. **Monitor performance** - Use APM tools

---

For more information, see the main [README.md](README.md)
