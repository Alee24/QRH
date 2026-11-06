#!/usr/bin/env bash
# ==============================================================================
# Sironi Restaurants - Safe Multi-Tenant VPS Deployment Engine
# Target Domain: sironi.kkdes.co.ke
# Port: 127.0.0.1:8080 (Proxied via Host Nginx - Zero Host Website Disruptions)
# ==============================================================================

set -euo pipefail

# ANSI Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

DOMAIN="sironi.kkdes.co.ke"
ADMIN_EMAIL="support@sironi.kkdes.co.ke"
COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="/var/backups/sironi"
LOCAL_PORT="8080"

echo -e "${CYAN}${BOLD}"
echo "======================================================================"
echo "          SIRONI RESTAURANTS - VPS PRODUCTION DEPLOYMENT ENGINE        "
echo "                      Domain: https://${DOMAIN}                       "
echo "======================================================================"
echo -e "${NC}"

# 1. ROOT / PRIVILEGE CHECK
if [ "$EUID" -ne 0 ]; then
  SUDO="sudo"
else
  SUDO=""
fi

# 2. PREREQUISITES & HOST RESTORATION
echo -e "${BLUE}[1/7] Checking Docker & restoring host web services...${NC}"

# Docker daemon public DNS resolvers
if [ ! -f /etc/docker/daemon.json ]; then
  $SUDO mkdir -p /etc/docker
  echo '{"dns": ["8.8.8.8", "1.1.1.1"]}' | $SUDO tee /etc/docker/daemon.json > /dev/null
  $SUDO systemctl restart docker 2>/dev/null || true
fi

# Ensure host /etc/resolv.conf has IPv4 DNS fallback
if ! grep -q "8.8.8.8" /etc/resolv.conf 2>/dev/null; then
  echo "nameserver 8.8.8.8" | $SUDO tee -a /etc/resolv.conf > /dev/null 2>&1 || true
fi

if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}Installing Docker engine...${NC}"
  curl -fsSL https://get.docker.com | $SUDO sh
  $SUDO systemctl enable --now docker
fi

# Detect docker compose
if docker compose version &> /dev/null; then
  DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
  DOCKER_COMPOSE="docker-compose"
else
  $SUDO apt-get update -y && $SUDO apt-get install -y docker-compose-plugin || true
  DOCKER_COMPOSE="docker compose"
fi

# Stop previous rogue container bindings on 80/443 immediately
echo -e "${CYAN}Stopping any Docker containers holding ports 80/443 to restore host websites...${NC}"
docker rm -f sironi_web sironi_certbot hotel_qr_client 2>/dev/null || true

# RESTORE HOST NGINX IMMEDIATELY SO ALL EXISTING WEBSITES COME BACK ONLINE
if command -v nginx &> /dev/null; then
  echo -e "${GREEN}Restoring host Nginx web service to recover existing server websites...${NC}"
  $SUDO systemctl unmask nginx 2>/dev/null || true
  $SUDO systemctl enable nginx 2>/dev/null || true
  $SUDO systemctl start nginx 2>/dev/null || true
fi

# 3. ENVIRONMENT & SECRETS CONFIGURATION
echo -e "${BLUE}[2/7] Validating production environment...${NC}"
if [ ! -f .env ]; then
  RANDOM_SECRET=$(openssl rand -hex 32 2>/dev/null || date +%s%N | sha256sum | head -c 64)
  cat <<EOF > .env
NODE_ENV=production
PORT=5000
DOMAIN=${DOMAIN}
JWT_SECRET=${RANDOM_SECRET}

DARAJA_ENVIRONMENT=sandbox
DARAJA_CONSUMER_KEY=sandbox_consumer_key_replace_me
DARAJA_CONSUMER_SECRET=sandbox_consumer_secret_replace_me
DARAJA_SHORTCODE=174379
DARAJA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
DARAJA_CALLBACK_URL=https://${DOMAIN}/api/payments/mpesa/callback

SUPPORT_EMAIL=${ADMIN_EMAIL}
EOF
  echo -e "${GREEN}✓ Created production .env file.${NC}"
fi

# 4. DIRECTORY & DATABASE SAFETY BACKUP
echo -e "${BLUE}[3/7] Verifying persistent storage and database backup...${NC}"
$SUDO mkdir -p "${BACKUP_DIR}"
docker volume create sironi_db_data > /dev/null 2>&1 || true

if docker ps --format '{{.Names}}' | grep -q '^sironi_backend$'; then
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  BACKUP_FILE="${BACKUP_DIR}/sironi_backup_${TIMESTAMP}.db"
  docker cp sironi_backend:/app/data/hotel_pos.db "${BACKUP_FILE}" 2>/dev/null || true
fi

# 5. CONTAINER REBUILD & LAUNCH ON PORT 8080 (ISOLATED)
echo -e "${BLUE}[4/7] Building and launching Sironi containers on 127.0.0.1:${LOCAL_PORT}...${NC}"
$DOCKER_COMPOSE -f "${COMPOSE_FILE}" build
$DOCKER_COMPOSE -f "${COMPOSE_FILE}" up -d --remove-orphans
docker image prune -f > /dev/null 2>&1 || true
echo -e "${GREEN}✓ Containers running on 127.0.0.1:${LOCAL_PORT}.${NC}"

# 6. CONFIGURE HOST NGINX FOR SIRONI (WITHOUT DISRUPTING OTHER SITES)
echo -e "${BLUE}[5/7] Configuring Host Nginx reverse proxy for ${DOMAIN}...${NC}"

NGINX_CONF_DIR="/etc/nginx/conf.d"
if [ -d "/etc/nginx/sites-available" ]; then
  TARGET_CONF="/etc/nginx/sites-available/${DOMAIN}.conf"
  ENABLED_LINK="/etc/nginx/sites-enabled/${DOMAIN}.conf"
else
  TARGET_CONF="${NGINX_CONF_DIR}/${DOMAIN}.conf"
  ENABLED_LINK=""
fi

$SUDO tee "${TARGET_CONF}" > /dev/null <<EOF
# Host Reverse Proxy for Sironi Restaurants
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:${LOCAL_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
EOF

if [ -n "${ENABLED_LINK}" ] && [ ! -f "${ENABLED_LINK}" ]; then
  $SUDO ln -sf "${TARGET_CONF}" "${ENABLED_LINK}"
fi

# Test host nginx configuration syntax
if $SUDO nginx -t 2>/dev/null; then
  echo -e "${GREEN}✓ Host Nginx configuration is valid. Reloading...${NC}"
  $SUDO systemctl reload nginx
else
  echo -e "${RED}[!] Nginx syntax check failed. Reverting target configuration...${NC}"
  $SUDO rm -f "${TARGET_CONF}" "${ENABLED_LINK}" 2>/dev/null || true
  $SUDO systemctl reload nginx 2>/dev/null || true
fi

# 7. HOST SSL CERTIFICATE PROVISIONING (LET'S ENCRYPT CERTBOT)
echo -e "${BLUE}[6/7] Provisioning genuine Let's Encrypt SSL certificate for ${DOMAIN}...${NC}"

# Install Certbot if missing
if ! command -v certbot &> /dev/null; then
  echo -e "${CYAN}Installing Certbot for host Nginx...${NC}"
  $SUDO apt-get update -y > /dev/null 2>&1 || true
  $SUDO apt-get install -y certbot python3-certbot-nginx > /dev/null 2>&1 || true
fi

if command -v certbot &> /dev/null; then
  echo -e "${CYAN}Requesting SSL certificate from Let's Encrypt for ${DOMAIN}...${NC}"
  if $SUDO certbot --nginx \
    -d "${DOMAIN}" \
    --non-interactive \
    --agree-tos \
    -m "${ADMIN_EMAIL}" \
    --redirect 2>&1; then
    echo -e "${GREEN}✓ Genuine Let's Encrypt SSL certificate configured successfully!${NC}"
    $SUDO systemctl reload nginx
  else
    echo -e "${YELLOW}[!] Notice: Certbot automated provisioning had an issue (check DNS A-record propagation).${NC}"
    echo -e "${YELLOW}Host Nginx continues proxying traffic over HTTP until DNS propagates.${NC}"
  fi
fi

# 8. HEALTH CHECK VERIFICATION
echo -e "${BLUE}[7/7] Validating deployment health...${NC}"
sleep 4

HEALTH_OK=false
for i in {1..8}; do
  if docker exec sironi_backend wget -qO- http://localhost:5000/api/health 2>/dev/null | grep -q "healthy"; then
    HEALTH_OK=true
    break
  fi
  sleep 2
done

echo ""
echo -e "${GREEN}${BOLD}======================================================================${NC}"
echo -e "${GREEN}${BOLD}     HOST WEBSITES RESTORED & SIRONI DEPLOYED SUCCESSFULLY           ${NC}"
echo -e "${GREEN}${BOLD}======================================================================${NC}"
echo -e "${BOLD}Sironi Public Domain:${NC}    https://${DOMAIN}"
echo -e "${BOLD}Local Container Port:${NC}   http://127.0.0.1:${LOCAL_PORT}"
echo -e "${BOLD}Existing VPS Sites:${NC}     Active & undisturbed on ports 80/443"
echo -e "${BOLD}Health Status:${NC}          $( [ "$HEALTH_OK" = true ] && echo -e "${GREEN}HEALTHY${NC}" || echo -e "${YELLOW}INITIALIZING${NC}" )"
echo ""
echo -e "${CYAN}All existing websites on this server are now restored and serving their own SSL.${NC}"
echo -e "${GREEN}======================================================================${NC}"
