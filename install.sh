#!/bin/bash

# =============================================================================
# Tischplanung App - Installation Script for Ubuntu Server 24.04
# Repository: https://github.com/lhaas-dev/event.git
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
print_success() { echo -e "${GREEN}[OK]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNUNG]${NC} $1"; }
print_error() { echo -e "${RED}[FEHLER]${NC} $1"; }

# Configuration
APP_DIR="/opt/event"
GITHUB_REPO="https://github.com/lhaas-dev/event.git"
DOMAIN="event.lhai.ch"
BACKEND_PORT=8001
FRONTEND_PORT=3000

echo ""
echo "=============================================="
echo "  Tischplanung App Installer"
echo "  Ubuntu Server 24.04"
echo "=============================================="
echo "  Repository: $GITHUB_REPO"
echo "  Installationspfad: $APP_DIR"
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

# Step 6: Clone repository from GitHub
print_status "Repository wird von GitHub geklont..."
if [ -d "$APP_DIR" ]; then
    print_warning "Verzeichnis $APP_DIR existiert bereits"
    read -p "Löschen und neu klonen? (j/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Jj]$ ]]; then
        rm -rf $APP_DIR
    else
        print_status "Bestehendes Verzeichnis wird aktualisiert..."
        cd $APP_DIR
        git pull origin main || git pull origin master
    fi
fi

if [ ! -d "$APP_DIR" ]; then
    git clone $GITHUB_REPO $APP_DIR
fi
cd $APP_DIR
print_success "Repository geklont nach $APP_DIR"

# Step 7: Setup Backend
print_status "Backend wird eingerichtet..."
cd $APP_DIR/backend

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create backend .env
JWT_SECRET=$(openssl rand -hex 32)
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=event_tischplanung
JWT_SECRET=$JWT_SECRET
CORS_ORIGINS=https://$DOMAIN,http://localhost:3000
EOF

deactivate
print_success "Backend eingerichtet"

# Step 8: Setup Frontend
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

# Step 9: Install serve globally
print_status "Serve wird installiert..."
npm install -g serve

# Step 10: Create systemd service for Backend
print_status "Systemd-Service für Backend wird erstellt..."
cat > /etc/systemd/system/event-backend.service << EOF
[Unit]
Description=Event Tischplanung Backend API
After=network.target mongod.service
Wants=mongod.service

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR/backend
Environment=PATH=$APP_DIR/backend/venv/bin:/usr/bin:/bin
ExecStart=$APP_DIR/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port $BACKEND_PORT
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Step 11: Create systemd service for Frontend
print_status "Systemd-Service für Frontend wird erstellt..."
cat > /etc/systemd/system/event-frontend.service << EOF
[Unit]
Description=Event Tischplanung Frontend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR/frontend
ExecStart=/usr/bin/serve -s build -l $FRONTEND_PORT
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Step 12: Configure Nginx
print_status "Nginx wird konfiguriert..."
cat > /etc/nginx/sites-available/event << EOF
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

ln -sf /etc/nginx/sites-available/event /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Step 13: Enable and start services
print_status "Services werden gestartet..."
systemctl daemon-reload
systemctl enable event-backend event-frontend
systemctl start event-backend event-frontend

# Step 14: Install Cloudflared
print_status "Cloudflared wird installiert..."
if ! command -v cloudflared &> /dev/null; then
    curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    dpkg -i cloudflared.deb
    rm cloudflared.deb
fi
print_success "Cloudflared installiert: $(cloudflared --version)"

# Step 15: Setup firewall
print_status "Firewall wird konfiguriert..."
if command -v ufw &> /dev/null; then
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
fi

# Step 16: Check services
echo ""
print_status "Services werden überprüft..."
sleep 3
systemctl is-active --quiet mongod && print_success "MongoDB: läuft" || print_error "MongoDB: nicht aktiv"
systemctl is-active --quiet event-backend && print_success "Backend: läuft" || print_error "Backend: nicht aktiv"
systemctl is-active --quiet event-frontend && print_success "Frontend: läuft" || print_error "Frontend: nicht aktiv"

# Final output
echo ""
echo "=============================================="
print_success "Installation abgeschlossen!"
echo "=============================================="
echo ""
echo -e "${YELLOW}Nächste Schritte - Cloudflare Tunnel einrichten:${NC}"
echo ""
echo "1. Bei Cloudflare anmelden:"
echo "   ${GREEN}cloudflared tunnel login${NC}"
echo ""
echo "2. Tunnel erstellen:"
echo "   ${GREEN}cloudflared tunnel create event${NC}"
echo "   (Notieren Sie sich die TUNNEL-ID!)"
echo ""
echo "3. DNS-Route erstellen:"
echo "   ${GREEN}cloudflared tunnel route dns event $DOMAIN${NC}"
echo ""
echo "4. Konfiguration erstellen:"
echo "   ${GREEN}nano /root/.cloudflared/config.yml${NC}"
echo ""
echo "   Inhalt (TUNNEL-ID ersetzen):"
echo "   ─────────────────────────────────"
echo "   tunnel: <TUNNEL-ID>"
echo "   credentials-file: /root/.cloudflared/<TUNNEL-ID>.json"
echo ""
echo "   ingress:"
echo "     - hostname: $DOMAIN"
echo "       path: /api/*"
echo "       service: http://localhost:$BACKEND_PORT"
echo "     - hostname: $DOMAIN"
echo "       service: http://localhost:$FRONTEND_PORT"
echo "     - service: http_status:404"
echo "   ─────────────────────────────────"
echo ""
echo "5. Tunnel als Service starten:"
echo "   ${GREEN}cloudflared service install${NC}"
echo "   ${GREEN}systemctl start cloudflared${NC}"
echo "   ${GREEN}systemctl enable cloudflared${NC}"
echo ""
echo "=============================================="
echo -e "${GREEN}Login-Daten:${NC}"
echo "  Benutzer: admin"
echo "  Passwort: admin123"
echo ""
echo -e "${GREEN}URL nach Tunnel-Setup:${NC} https://$DOMAIN"
echo -e "${GREEN}Lokaler Test:${NC} http://localhost"
echo "=============================================="
