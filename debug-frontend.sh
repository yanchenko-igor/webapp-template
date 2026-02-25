#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "╔════════════════════════════════════════╗"
echo "║   Frontend Health Check Diagnostic     ║"
echo "╚════════════════════════════════════════╝"
echo ""

# 1. Container Status
echo -e "${YELLOW}[1/7]${NC} Container Status"
STATUS=$(docker-compose ps frontend 2>/dev/null | grep frontend | awk '{print $3}')
if [[ "$STATUS" == *"Up"* ]]; then
    echo -e "      ${GREEN}✓ Container is Up${NC}"
elif [[ "$STATUS" == *"unhealthy"* ]]; then
    echo -e "      ${RED}✗ Container is unhealthy${NC}"
else
    echo -e "      ${RED}✗ Container not running: $STATUS${NC}"
fi

# 2. Recent Logs
echo -e "\n${YELLOW}[2/7]${NC} Recent Logs (last 10 lines)"
docker-compose logs --tail=10 frontend 2>/dev/null | sed 's/^/      /'

# 3. Health Endpoint
echo -e "\n${YELLOW}[3/7]${NC} Testing Health Endpoint"
HEALTH=$(docker-compose exec -T frontend wget -q -O- http://localhost:8080/health 2>/dev/null)
if [[ "$HEALTH" == *"healthy"* ]]; then
    echo -e "      ${GREEN}✓ Health endpoint OK: $HEALTH${NC}"
else
    echo -e "      ${RED}✗ Health endpoint failed${NC}"
    echo "      Response: $HEALTH"
fi

# 4. Nginx Config
echo -e "\n${YELLOW}[4/7]${NC} Nginx Configuration"
if docker-compose exec -T frontend nginx -t 2>&1 | grep -q "successful"; then
    echo -e "      ${GREEN}✓ Nginx config is valid${NC}"
else
    echo -e "      ${RED}✗ Nginx config has errors${NC}"
    docker-compose exec -T frontend nginx -t 2>&1 | sed 's/^/      /'
fi

# 5. Files in Container
echo -e "\n${YELLOW}[5/7]${NC} Files in /usr/share/nginx/html"
FILE_COUNT=$(docker-compose exec -T frontend ls -1 /usr/share/nginx/html 2>/dev/null | wc -l)
if [ "$FILE_COUNT" -gt 0 ]; then
    echo -e "      ${GREEN}✓ Found $FILE_COUNT files${NC}"
    docker-compose exec -T frontend ls -la /usr/share/nginx/html 2>/dev/null | head -5 | sed 's/^/      /'
else
    echo -e "      ${RED}✗ No files found!${NC}"
fi

# 6. Nginx Process
echo -e "\n${YELLOW}[6/7]${NC} Nginx Process"
if docker-compose exec -T frontend ps aux 2>/dev/null | grep -q "nginx: master"; then
    echo -e "      ${GREEN}✓ Nginx is running${NC}"
    docker-compose exec -T frontend ps aux 2>/dev/null | grep nginx | sed 's/^/      /'
else
    echo -e "      ${RED}✗ Nginx not running${NC}"
fi

# 7. Port Check
echo -e "\n${YELLOW}[7/7]${NC} Port 8080 Status"
if docker-compose exec -T frontend netstat -tuln 2>/dev/null | grep -q ":8080"; then
    echo -e "      ${GREEN}✓ Port 8080 is listening${NC}"
else
    echo -e "      ${RED}✗ Port 8080 not listening${NC}"
fi

echo ""
echo "╔════════════════════════════════════════╗"
echo "║            Recommendations             ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check if wget exists
if ! docker-compose exec -T frontend which wget >/dev/null 2>&1; then
    echo -e "${RED}✗ wget is not installed in container${NC}"
    echo "  Fix: Rebuild with: docker-compose build --no-cache frontend"
fi

# Check if index.html exists
if ! docker-compose exec -T frontend test -f /usr/share/nginx/html/index.html 2>/dev/null; then
    echo -e "${RED}✗ index.html is missing${NC}"
    echo "  Fix: React build may have failed. Check package-lock.json exists."
fi

echo ""
echo "Common fixes:"
echo "  1. docker-compose down"
echo "  2. docker-compose build --no-cache frontend"
echo "  3. docker-compose up"
echo ""
echo "For detailed help, see: FRONTEND_HEALTH_DEBUG.md"
echo ""
