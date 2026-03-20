#!/bin/bash

# =============================================================================
# Tischplanung App - Installation Script for Ubuntu Server 24.04
# Domain: event.lhai.ch (via Cloudflare Tunnel)
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuration
APP_DIR="/opt/tischplanung"
APP_USER="tischplanung"
DOMAIN="event.lhai.ch"
BACKEND_PORT=8001
FRONTEND_PORT=3000

echo ""
echo "=============================================="
echo "  Tischplanung App Installer"
echo "  Ubuntu Server 24.04"
echo "  Domain: $DOMAIN"
echo "=============================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Bitte als root ausführen: sudo bash install.sh"
    exit 1
fi

# Step 1: System Update
print_status "System wird aktualisiert..."
apt update && apt upgrade -y

# Step 2: Install dependencies
print_status "Abhängigkeiten werden installiert..."
apt install -y \
    curl \
    wget \
    git \
    build-essential \
    python3 \
    python3-pip \
    python3-venv \
    nginx \
    certbot \
    python3-certbot-nginx \
    gnupg \
    lsb-release

# Step 3: Install Node.js 20.x
print_status "Node.js 20.x wird installiert..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
print_success "Node.js Version: $(node --version)"

# Step 4: Install Yarn
print_status "Yarn wird installiert..."
npm install -g yarn
print_success "Yarn Version: $(yarn --version)"

# Step 5: Install MongoDB 7.0
print_status "MongoDB 7.0 wird installiert..."
if ! command -v mongod &> /dev/null; then
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
        gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
        tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt update
    apt install -y mongodb-org
fi
systemctl start mongod
systemctl enable mongod
print_success "MongoDB läuft"

# Step 6: Create app user
print_status "App-Benutzer wird erstellt..."
if ! id "$APP_USER" &>/dev/null; then
    useradd -r -s /bin/false -d $APP_DIR $APP_USER
fi

# Step 7: Create app directory
print_status "App-Verzeichnis wird erstellt..."
mkdir -p $APP_DIR
cd $APP_DIR

# Step 8: Copy application files (assumes files are in current directory)
print_status "Anwendungsdateien werden kopiert..."
if [ -d "/tmp/tischplanung-source" ]; then
    cp -r /tmp/tischplanung-source/* $APP_DIR/
else
    print_warning "Bitte kopieren Sie die Anwendungsdateien nach $APP_DIR"
    print_warning "Struktur: backend/, frontend/, memory/"
fi

# Step 9: Setup Backend
print_status "Backend wird eingerichtet..."
cd $APP_DIR/backend

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create backend .env
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=tischplanung
JWT_SECRET=$(openssl rand -hex 32)
CORS_ORIGINS=https://$DOMAIN,http://localhost:3000
EOF

print_success "Backend eingerichtet"

# Step 10: Setup Frontend
print_status "Frontend wird eingerichtet..."
cd $APP_DIR/frontend

# Create frontend .env
cat > .env << EOF
REACT_APP_BACKEND_URL=https://$DOMAIN
EOF

# Install dependencies and build
yarn install
yarn build

print_success "Frontend eingerichtet und gebaut"

# Step 11: Set permissions
print_status "Berechtigungen werden gesetzt..."
chown -R $APP_USER:$APP_USER $APP_DIR
chmod -R 755 $APP_DIR

# Step 12: Create systemd service for Backend
print_status "Systemd-Service für Backend wird erstellt..."
cat > /etc/systemd/system/tischplanung-backend.service << EOF
[Unit]
Description=Tischplanung Backend API
After=network.target mongod.service
Wants=mongod.service

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR/backend
Environment=PATH=$APP_DIR/backend/venv/bin
ExecStart=$APP_DIR/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port $BACKEND_PORT
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Step 13: Create systemd service for Frontend (serve static)
print_status "Systemd-Service für Frontend wird erstellt..."
npm install -g serve
cat > /etc/systemd/system/tischplanung-frontend.service << EOF
[Unit]
Description=Tischplanung Frontend
After=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR/frontend
ExecStart=/usr/bin/serve -s build -l $FRONTEND_PORT
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Step 14: Configure Nginx (for local testing without Cloudflare)
print_status "Nginx wird konfiguriert..."
cat > /etc/nginx/sites-available/tischplanung << EOF
server {
    listen 80;
    server_name $DOMAIN localhost;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/tischplanung /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Step 15: Enable and start services
print_status "Services werden gestartet..."
systemctl daemon-reload
systemctl enable tischplanung-backend tischplanung-frontend
systemctl start tischplanung-backend tischplanung-frontend

# Step 16: Install Cloudflared
print_status "Cloudflared wird installiert..."
if ! command -v cloudflared &> /dev/null; then
    curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    dpkg -i cloudflared.deb
    rm cloudflared.deb
fi
print_success "Cloudflared installiert: $(cloudflared --version)"

# Step 17: Setup firewall
print_status "Firewall wird konfiguriert..."
if command -v ufw &> /dev/null; then
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
fi

# Final output
echo ""
echo "=============================================="
print_success "Installation abgeschlossen!"
echo "=============================================="
echo ""
echo "Nächste Schritte:"
echo ""
echo "1. Cloudflare Tunnel einrichten:"
echo "   cloudflared tunnel login"
echo "   cloudflared tunnel create tischplanung"
echo "   cloudflared tunnel route dns tischplanung $DOMAIN"
echo ""
echo "2. Tunnel-Konfiguration erstellen:"
echo "   nano ~/.cloudflared/config.yml"
echo ""
echo "3. Tunnel als Service starten:"
echo "   cloudflared service install"
echo "   systemctl start cloudflared"
echo ""
echo "4. Services prüfen:"
echo "   systemctl status tischplanung-backend"
echo "   systemctl status tischplanung-frontend"
echo "   systemctl status cloudflared"
echo ""
echo "Login-Daten:"
echo "  Benutzer: admin"
echo "  Passwort: admin123"
echo ""
echo "URL: https://$DOMAIN"
echo "=============================================="
