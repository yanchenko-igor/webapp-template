#!/bin/bash

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "╔═══════════════════════════════════════╗"
echo "║   Web App Health Check Test Suite    ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# Test 1: Backend Health (via nginx)
echo -e "${YELLOW}[1/7]${NC} Testing Backend Health (via nginx)..."
if curl -sf http://localhost/health > /dev/null 2>&1; then
    echo -e "      ${GREEN}✓ Backend healthy${NC}"
else
    echo -e "      ${RED}✗ Backend health check failed${NC}"
fi

# Test 2: Frontend serving (via nginx)
echo -e "${YELLOW}[2/7]${NC} Testing Frontend (via nginx)..."
if curl -sf http://localhost/ | grep -q "<title>" 2>/dev/null; then
    echo -e "      ${GREEN}✓ Frontend serving HTML${NC}"
else
    echo -e "      ${RED}✗ Frontend not serving${NC}"
fi

# Test 3: API endpoint
echo -e "${YELLOW}[3/7]${NC} Testing API endpoint..."
if curl -sf http://localhost/api/messages | grep -q "messages" 2>/dev/null; then
    echo -e "      ${GREEN}✓ API responding${NC}"
else
    echo -e "      ${RED}✗ API not responding${NC}"
fi

# Test 4: Frontend Health (direct)
echo -e "${YELLOW}[4/7]${NC} Testing Frontend Health (direct)..."
if docker-compose exec -T frontend wget -q -O- http://localhost:8080/health 2>/dev/null | grep -q "healthy"; then
    echo -e "      ${GREEN}✓ Frontend health check OK${NC}"
else
    echo -e "      ${RED}✗ Frontend health check failed${NC}"
fi

# Test 5: Backend Health (direct)
echo -e "${YELLOW}[5/7]${NC} Testing Backend Health (direct)..."
if docker-compose exec -T backend node -e "require('http').get('http://localhost:3001/health', r => { r.on('data', d => { if(JSON.parse(d).status === 'healthy') process.exit(0); }); r.on('end', () => process.exit(1)); });" 2>/dev/null; then
    echo -e "      ${GREEN}✓ Backend direct health OK${NC}"
else
    echo -e "      ${RED}✗ Backend direct health failed${NC}"
fi

# Test 6: Container Status
echo -e "${YELLOW}[6/7]${NC} Checking Container Status..."
if docker-compose ps | grep -q "Up"; then
    UP_COUNT=$(docker-compose ps | grep "Up" | wc -l)
    echo -e "      ${GREEN}✓ $UP_COUNT containers running${NC}"
else
    echo -e "      ${RED}✗ Some containers not running${NC}"
fi

# Test 7: Nginx Configuration
echo -e "${YELLOW}[7/7]${NC} Testing Nginx Configuration..."
if docker-compose exec -T nginx nginx -t 2>&1 | grep -q "successful"; then
    echo -e "      ${GREEN}✓ Nginx config valid${NC}"
else
    echo -e "      ${RED}✗ Nginx config has errors${NC}"
fi

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║            Test Summary               ║"
echo "╚═══════════════════════════════════════╝"
echo ""
echo "Access URLs:"
echo -e "  Main App:  ${GREEN}http://localhost/${NC}"
echo -e "  API:       ${GREEN}http://localhost/api/messages${NC}"
echo -e "  Health:    ${GREEN}http://localhost/health${NC}"
echo ""
echo "Container Status:"
docker-compose ps
echo ""
