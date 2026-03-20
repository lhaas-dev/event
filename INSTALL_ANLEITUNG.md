# Event Tischplanung - Installationsanleitung

## Voraussetzungen
- Ubuntu Server 24.04 LTS
- Root-Zugang (sudo)
- Cloudflare Account mit Domain event.lhai.ch
- Min. 2GB RAM, 10GB Speicher

---

## Schnellinstallation

```bash
# Als root anmelden
sudo su -

# Repository klonen und installieren
git clone https://github.com/lhaas-dev/event.git /opt/event
cd /opt/event
chmod +x install.sh
./install.sh
```

---

## Nach der Installation: Cloudflare Tunnel

### 1. Bei Cloudflare anmelden
```bash
cloudflared tunnel login
```
Dies öffnet einen Browser-Link. Melden Sie sich an und autorisieren Sie den Tunnel.

### 2. Tunnel erstellen
```bash
cloudflared tunnel create event
```
**Notieren Sie sich die TUNNEL-ID** (z.B. `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

### 3. DNS-Eintrag erstellen
```bash
cloudflared tunnel route dns event event.lhai.ch
```

### 4. Tunnel-Konfiguration erstellen
```bash
nano /root/.cloudflared/config.yml
```

Fügen Sie ein (ersetzen Sie `<TUNNEL-ID>` mit Ihrer ID):
```yaml
tunnel: <TUNNEL-ID>
credentials-file: /root/.cloudflared/<TUNNEL-ID>.json

ingress:
  - hostname: event.lhai.ch
    path: /api/*
    service: http://localhost:8001
  - hostname: event.lhai.ch
    service: http://localhost:3000
  - service: http_status:404
```

### 5. Tunnel als Service installieren
```bash
cloudflared service install
systemctl start cloudflared
systemctl enable cloudflared
```

---

## Überprüfung

### Services prüfen
```bash
systemctl status mongod
systemctl status event-backend
systemctl status event-frontend
systemctl status cloudflared
```

### Logs ansehen
```bash
journalctl -u event-backend -f
journalctl -u event-frontend -f
journalctl -u cloudflared -f
```

### API Test
```bash
curl http://localhost:8001/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## Fertig!

**URL:** https://event.lhai.ch

**Login-Daten:**
- Benutzer: `admin`
- Passwort: `admin123`

---

## Wartung

### Updates einspielen
```bash
cd /opt/event
git pull origin main

# Backend neu starten
cd backend
source venv/bin/activate
pip install -r requirements.txt
systemctl restart event-backend

# Frontend neu bauen
cd ../frontend
yarn install
yarn build
systemctl restart event-frontend
```

### Backup
```bash
# MongoDB Backup
mongodump --db event_tischplanung --out /backup/$(date +%Y%m%d)

# Wiederherstellen
mongorestore --db event_tischplanung /backup/DATUM/event_tischplanung
```

---

## Fehlerbehebung

### MongoDB startet nicht
```bash
journalctl -u mongod -n 50
systemctl restart mongod
```

### Backend startet nicht
```bash
journalctl -u event-backend -n 50
cd /opt/event/backend
source venv/bin/activate
python -c "import server; print('OK')"
```

### Cloudflare Tunnel funktioniert nicht
```bash
cloudflared tunnel info event
cloudflared tunnel ingress validate
cloudflared tunnel run event  # Manueller Test
```
