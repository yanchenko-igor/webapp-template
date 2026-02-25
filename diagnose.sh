#!/bin/bash

# Diagnostic script for debugging nginx 404 issues

echo "╔════════════════════════════════════════╗"
echo "║   Frontend Debugging Diagnostic        ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== 1. Container Status ===${NC}"
docker-compose ps
echo ""

echo -e "${YELLOW}=== 2. Port Mappings ===${NC}"
docker port webapp-frontend 2>/dev/null || echo "Frontend container not running"
echo ""

echo -e "${YELLOW}=== 3. Testing Endpoints ===${NC}"
echo -n "Health endpoint (port 3000): "
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Working${NC}"
else
    echo -e "${RED}✗ Failed${NC}"
fi

echo -n "Main page (port 3000): "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✓ Working${NC}"
else
    echo -e "${RED}✗ Failed (404)${NC}"
fi

echo -n "Wrong port test (8080): "
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo -e "${RED}✗ Unexpected (port should not be exposed)${NC}"
else
    echo -e "${GREEN}✓ Correctly not exposed${NC}"
fi
echo ""

echo -e "${YELLOW}=== 4. Files in Container ===${NC}"
if docker exec webapp-frontend ls -la /usr/share/nginx/html 2>/dev/null; then
    echo ""
    echo -e "${GREEN}✓ Files found${NC}"
else
    echo -e "${RED}✗ Cannot access container or files missing${NC}"
fi
echo ""

echo -e "${YELLOW}=== 5. Nginx Configuration Test ===${NC}"
if docker exec webapp-frontend nginx -t 2>&1; then
    echo -e "${GREEN}✓ Nginx config valid${NC}"
else
    echo -e "${RED}✗ Nginx config has errors${NC}"
fi
echo ""

echo -e "${YELLOW}=== 6. Recent Frontend Logs ===${NC}"
docker-compose logs --tail=15 frontend
echo ""

echo -e "${YELLOW}=== 7. Network Connectivity ===${NC}"
echo -n "Can backend reach frontend? "
if docker exec webapp-backend wget -q -O- http://frontend:8080/health 2>/dev/null; then
    echo -e "${GREEN}✓ Yes${NC}"
else
    echo -e "${RED}✗ No${NC}"
fi
echo ""

echo "╔════════════════════════════════════════╗"
echo "║            Summary                     ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Frontend should be accessible at:"
echo -e "  ${GREEN}http://localhost:3000${NC}"
echo -e "  ${GREEN}http://127.0.0.1:3000${NC}"
echo ""
echo "NOT accessible at:"
echo -e "  ${RED}http://localhost:8080 (port not exposed)${NC}"
echo ""
echo "If you see 404 errors:"
echo "1. Make sure you're using port 3000, not 8080"
echo "2. Check that files exist in the container (section 4 above)"
echo "3. Verify nginx config is valid (section 5 above)"
echo "4. Check logs for errors (section 6 above)"
echo ""
echo "To change to port 8080, edit docker-compose.yml:"
echo "  ports:"
echo "    - \"8080:8080\"  # instead of \"3000:8080\""
echo ""
