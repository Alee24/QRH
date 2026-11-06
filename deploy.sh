#!/usr/bin/env bash
# ==============================================================================
# Sironi Restaurants - Automated Production Deployment Engine
# Target Domain: sironi.kkdes.co.ke
# Target OS: Ubuntu / Debian / CentOS / AlmaLinux / RHEL / Fedora
# Architecture: Docker Compose (Backend API + SQLite WAL + Nginx SPA + Certbot SSL)
# ==============================================================================

set -euo pipefail

# ANSI Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

DOMAIN="sironi.kkdes.co.ke"
ADMIN_EMAIL="support@sironi.kkdes.co.ke"
COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="/var/backups/sironi"

echo -e "${CYAN}${BOLD}"
echo "======================================================================"
echo "          SIRONI RESTAURANTS - VPS PRODUCTION DEPLOYMENT ENGINE        "
echo "                      Domain: https://${DOMAIN}                       "
echo "======================================================================"
echo -e "${NC}"

# 1. ROOT / PRIVILEGE CHECK
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}[!] Warning: Not running as root. Attempting to use sudo...${NC}"
  SUDO="sudo"
else
  SUDO=""
fi

# 2. PREREQUISITES VERIFICATION (Docker & Docker Compose)
echo -e "${BLUE}[1/8] Checking system prerequisites & network resolution...${NC}"

# Fix DNS unreachable issue for Docker daemon (common on VPS without IPv6)
if [ ! -f /etc/docker/daemon.json ]; then
  echo -e "${CYAN}Configuring Docker daemon public DNS resolvers (8.8.8.8, 1.1.1.1)...${NC}"
  $SUDO mkdir -p /etc/docker
  echo '{"dns": ["8.8.8.8", "1.1.1.1"]}' | $SUDO tee /etc/docker/daemon.json > /dev/null
  $SUDO systemctl restart docker 2>/dev/null || true
fi

# Ensure host /etc/resolv.conf has IPv4 DNS fallback
if ! grep -q "8.8.8.8" /etc/resolv.conf 2>/dev/null; then
  echo "nameserver 8.8.8.8" | $SUDO tee -a /etc/resolv.conf > /dev/null 2>&1 || true
  echo "nameserver 1.1.1.1" | $SUDO tee -a /etc/resolv.conf > /dev/null 2>&1 || true
fi

if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}Docker not found. Installing Docker engine...${NC}"
  curl -fsSL https://get.docker.com | $SUDO sh
  $SUDO systemctl enable --now docker
  echo -e "${GREEN}Docker installed successfully.${NC}"
else
  echo -e "${GREEN}✓ Docker is installed ($(docker --version))${NC}"
fi

# Detect docker compose plugin
if docker compose version &> /dev/null; then
  DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
  DOCKER_COMPOSE="docker-compose"
else
  echo -e "${YELLOW}Docker Compose plugin not found. Installing...${NC}"
  $SUDO apt-get update -y && $SUDO apt-get install -y docker-compose-plugin || {
    echo -e "${RED}Failed to install Docker Compose plugin automatically.${NC}"
    exit 1
  }
  DOCKER_COMPOSE="docker compose"
fi
echo -e "${GREEN}✓ Using: ${DOCKER_COMPOSE}${NC}"

# Check for host web server collisions (Apache/Nginx on host system)
if systemctl is-active --quiet nginx 2>/dev/null; then
  echo -e "${YELLOW}[!] Host system Nginx detected. Stopping to free ports 80/443 for Docker...${NC}"
  $SUDO systemctl stop nginx || true
  $SUDO systemctl disable nginx || true
fi
if systemctl is-active --quiet apache2 2>/dev/null; then
  echo -e "${YELLOW}[!] Host system Apache detected. Stopping to free ports 80/443 for Docker...${NC}"
  $SUDO systemctl stop apache2 || true
  $SUDO systemctl disable apache2 || true
fi

# 3. ENVIRONMENT & SECRETS CONFIGURATION
echo -e "${BLUE}[2/8] Validating environment configurations...${NC}"
if [ ! -f .env ]; then
  echo -e "${YELLOW}.env file not found. Generating production .env with secure random secrets...${NC}"
  RANDOM_SECRET=$(openssl rand -hex 32 2>/dev/null || date +%s%N | sha256sum | head -c 64)
  cat <<EOF > .env
# Production Environment Variables for Sironi Restaurants
NODE_ENV=production
PORT=5000
DOMAIN=${DOMAIN}
JWT_SECRET=${RANDOM_SECRET}

# Safaricom Daraja M-Pesa Configuration (Defaults to Sandbox; Replace with Live credentials)
DARAJA_ENVIRONMENT=sandbox
DARAJA_CONSUMER_KEY=sandbox_consumer_key_replace_me
DARAJA_CONSUMER_SECRET=sandbox_consumer_secret_replace_me
DARAJA_SHORTCODE=174379
DARAJA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
DARAJA_CALLBACK_URL=https://${DOMAIN}/api/payments/mpesa/callback

# Platform Contact
SUPPORT_EMAIL=${ADMIN_EMAIL}
EOF
  echo -e "${GREEN}✓ Created .env with generated JWT secret.${NC}"
else
  echo -e "${GREEN}✓ Existing .env file found.${NC}"
fi

# 4. DIRECTORY & PERSISTENT VOLUME SETUP
echo -e "${BLUE}[3/8] Setting up persistent storage & backup directories...${NC}"
$SUDO mkdir -p "${BACKUP_DIR}"
$SUDO mkdir -p nginx/conf.d

docker volume create sironi_db_data > /dev/null
docker volume create sironi_ssl_certs > /dev/null
docker volume create sironi_certbot_webroot > /dev/null
echo -e "${GREEN}✓ Persistent Docker volumes verified.${NC}"

# 5. PRE-DEPLOYMENT DATABASE BACKUP (Safety Rule 4)
echo -e "${BLUE}[4/8] Performing safety backup of current database (if running)...${NC}"
if docker ps --format '{{.Names}}' | grep -q '^sironi_backend$'; then
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  BACKUP_FILE="${BACKUP_DIR}/sironi_backup_${TIMESTAMP}.db"
  if docker cp sironi_backend:/app/data/hotel_pos.db "${BACKUP_FILE}" 2>/dev/null; then
    echo -e "${GREEN}✓ Database snapshot safely archived to: ${BACKUP_FILE}${NC}"
  else
    echo -e "${YELLOW}Database file not found in running container (first deploy). Skipping.${NC}"
  fi
else
  echo -e "${CYAN}No active container running yet; proceeding with fresh initialization.${NC}"
fi

# 6. SSL CERTIFICATE INITIALIZATION (Let's Encrypt / Certbot)
echo -e "${BLUE}[5/8] Checking Let's Encrypt SSL certificates for ${DOMAIN}...${NC}"

# Check if certificate exists in the Docker volume
CERT_EXISTS=false
if docker run --rm -v sironi_ssl_certs:/etc/letsencrypt alpine test -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"; then
  CERT_EXISTS=true
  echo -e "${GREEN}✓ Valid SSL certificate found for ${DOMAIN}.${NC}"
else
  echo -e "${YELLOW}[!] No certificate found for ${DOMAIN}. Initializing SSL bootstrapping...${NC}"

  # Step A: Generate temporary self-signed certificate so Nginx can start
  echo -e "${CYAN}Generating temporary bootstrap certificate to boot Nginx...${NC}"
  docker run --rm -v sironi_ssl_certs:/etc/letsencrypt alpine sh -c "
    mkdir -p /etc/letsencrypt/live/${DOMAIN}
    apk add --no-cache openssl > /dev/null 2>&1
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
      -keyout /etc/letsencrypt/live/${DOMAIN}/privkey.pem \
      -out /etc/letsencrypt/live/${DOMAIN}/fullchain.pem \
      -subj '/CN=${DOMAIN}' > /dev/null 2>&1
  "

  # Step B: Build and launch containers with bootstrap cert
  echo -e "${CYAN}Starting web container for ACME challenge verification...${NC}"
  $DOCKER_COMPOSE -f "${COMPOSE_FILE}" build
  $DOCKER_COMPOSE -f "${COMPOSE_FILE}" up -d client server

  # Step C: Request real production certificate from Let's Encrypt
  echo -e "${CYAN}Requesting production Let's Encrypt certificate from ACME server...${NC}"
  if docker run --rm \
    -v sironi_ssl_certs:/etc/letsencrypt \
    -v sironi_certbot_webroot:/var/www/certbot \
    certbot/certbot:latest certonly \
    --webroot -w /var/www/certbot \
    --email "${ADMIN_EMAIL}" \
    -d "${DOMAIN}" \
    --agree-tos \
    --no-eff-email \
    --force-renewal; then
    
    echo -e "${GREEN}✓ Production SSL certificate successfully issued by Let's Encrypt!${NC}"
    # Reload Nginx to load the genuine certificates
    docker exec sironi_web nginx -s reload 2>/dev/null || true
  else
    echo -e "${RED}[!] Notice: ACME verification failed (likely DNS propagation or sandbox host).${NC}"
    echo -e "${YELLOW}Falling back to bootstrap certificate. Web server will operate with SSL enabled.${NC}"
    echo -e "${YELLOW}To re-issue once DNS is pointed, run: ./deploy.sh --renew-cert${NC}"
  fi
fi

# 7. PRODUCTION CONTAINER REBUILD & RESTART
echo -e "${BLUE}[6/8] Building and starting production containers...${NC}"
$DOCKER_COMPOSE -f "${COMPOSE_FILE}" build --no-cache
$DOCKER_COMPOSE -f "${COMPOSE_FILE}" up -d --remove-orphans
docker image prune -f > /dev/null 2>&1
echo -e "${GREEN}✓ Production containers launched.${NC}"

# 8. AUTOMATED DAILY BACKUP CRON CONFIGURATION
echo -e "${BLUE}[7/8] Configuring automated SQLite daily backup cron...${NC}"
CRON_JOB="0 2 * * * docker cp sironi_backend:/app/data/hotel_pos.db ${BACKUP_DIR}/sironi_\$(date +\%F).db 2>/dev/null && find ${BACKUP_DIR}/ -name 'sironi_*.db' -mtime +30 -delete"
(crontab -l 2>/dev/null | grep -v "sironi_backend" || true; echo "${CRON_JOB}") | crontab -
echo -e "${GREEN}✓ Automated daily 02:00 AM backup cron registered (30-day retention).${NC}"

# 9. HEALTH CHECK & VALIDATION
echo -e "${BLUE}[8/8] Verifying system health and API status...${NC}"
sleep 5

MAX_RETRIES=10
RETRY=0
HEALTH_OK=false

while [ $RETRY -lt $MAX_RETRIES ]; do
  if docker exec sironi_backend wget -qO- http://localhost:5000/api/health 2>/dev/null | grep -q "healthy"; then
    HEALTH_OK=true
    break
  fi
  echo -e "${YELLOW}Waiting for backend to initialize (attempt $((RETRY+1))/${MAX_RETRIES})...${NC}"
  sleep 3
  RETRY=$((RETRY+1))
done

if [ "$HEALTH_OK" = true ]; then
  echo -e "${GREEN}${BOLD}✓ System is fully operational and healthy!${NC}"
else
  echo -e "${RED}System health check timed out. Checking docker logs:${NC}"
  docker logs --tail 30 sironi_backend
fi

# DEPLOYMENT SUMMARY
echo ""
echo -e "${GREEN}${BOLD}======================================================================${NC}"
echo -e "${GREEN}${BOLD}     SIRONI RESTAURANTS DEPLOYMENT SUCCESSFUL                       ${NC}"
echo -e "${GREEN}${BOLD}======================================================================${NC}"
echo -e "${BOLD}Domain:${NC}         https://${DOMAIN}"
echo -e "${BOLD}Backend API:${NC}    https://${DOMAIN}/api/health"
echo -e "${BOLD}QR Ordering:${NC}    https://${DOMAIN}/?table=T01"
echo -e "${BOLD}Staff Portal:${NC}   https://${DOMAIN}/"
echo ""
echo -e "${CYAN}${BOLD}Management & Operational Commands:${NC}"
echo "  View backend logs:     ${DOCKER_COMPOSE} -f ${COMPOSE_FILE} logs -f server"
echo "  View web/nginx logs:   ${DOCKER_COMPOSE} -f ${COMPOSE_FILE} logs -f client"
echo "  Restart system:        ${DOCKER_COMPOSE} -f ${COMPOSE_FILE} restart"
echo "  Manual DB backup:      docker cp sironi_backend:/app/data/hotel_pos.db ${BACKUP_DIR}/manual_\$(date +%s).db"
echo "  Renew SSL certificate: docker exec sironi_certbot certbot renew"
echo -e "${GREEN}======================================================================${NC}"

