# Production Deployment & Operations Guide

## 1. Prerequisites

- A Linux VPS (Ubuntu 22.04 LTS / 24.04 LTS recommended)
- Minimum Specs: 2 vCPU, 2 GB RAM, 20 GB SSD
- Docker Engine 24+ and Docker Compose v2+ installed
- Domain name with DNS pointing to your VPS IP (e.g. `pos.grandheritagehotel.com`)

---

## 2. Fast Production Setup

### Step 1: Clone Repository & Configure Environment

```bash
git clone <repository_url> /opt/hotel-qr-pos
cd /opt/hotel-qr-pos
cp .env.example .env
nano .env
```

Ensure the following variables are configured in `.env`:
```env
PORT=5000
NODE_ENV=production
JWT_SECRET=generate_a_64_char_crypto_random_secret_here

# Safaricom Daraja Production Credentials
DARAJA_ENVIRONMENT=live
DARAJA_CONSUMER_KEY=your_production_consumer_key
DARAJA_CONSUMER_SECRET=your_production_consumer_secret
DARAJA_SHORTCODE=your_till_or_paybill_number
DARAJA_PASSKEY=your_production_passkey
DARAJA_CALLBACK_URL=https://pos.grandheritagehotel.com/api/payments/mpesa/callback
```

### Step 2: Build & Start Containers

```bash
docker compose build --no-cache && \
docker compose up -d && \
docker image prune -f
```

---

## 3. Production SSL / Nginx Reverse Proxy (Certbot)

To secure client connections with HTTPS (required for Daraja Webhooks):

```bash
sudo apt update && sudo apt install -y certbot nginx

# Generate SSL Certificate
sudo certbot certonly --standalone -d pos.grandheritagehotel.com
```

Add Nginx Host Configuration (`/etc/nginx/sites-available/hotel-pos.conf`):

```nginx
server {
    listen 80;
    server_name pos.grandheritagehotel.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pos.grandheritagehotel.com;

    ssl_certificate /etc/letsencrypt/live/pos.grandheritagehotel.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pos.grandheritagehotel.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

Enable and reload:
```bash
sudo ln -s /etc/nginx/sites-available/hotel-pos.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 4. Routine Maintenance & Zero-Downtime Updates

```bash
git pull origin main && \
docker compose build --no-cache && \
docker compose up -d && \
docker image prune -f
```

---

## 5. Automated Daily Backup Cron Job

Add the following to `/etc/cron.daily/backup-hotel-pos`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/hotel-pos"
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d_%H%M%S)

# Copy database file
docker cp hotel_qr_server:/app/data/restaurant_pos.sqlite "$BACKUP_DIR/db_$DATE.sqlite"

# Keep last 14 days of backups
find "$BACKUP_DIR" -type f -mtime +14 -delete
```

Make executable:
```bash
chmod +x /etc/cron.daily/backup-hotel-pos
```
