# First Time Setup - Generate Lock Files

Before building Docker images, you need to generate `package-lock.json` files:

```bash
# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..
```

This creates the lock files that Docker needs. These files should be committed to git:

```bash
git add backend/package-lock.json frontend/package-lock.json
git commit -m "Add package-lock.json files"
```

After this, Docker builds will work correctly.

## Why is this needed?

The Dockerfiles use `npm install` which requires lock files to ensure reproducible builds. The lock files pin exact versions of all dependencies.

## Alternative: Use the setup script

The `setup.sh` script handles this automatically:

```bash
./setup.sh
# Choose option 2 or 3 to install dependencies
```
