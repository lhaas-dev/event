# Tischplanung - Installationsanleitung für Ubuntu Server 24.04

## Voraussetzungen
- Ubuntu Server 24.04 LTS
- Root-Zugang (sudo)
- Cloudflare Account mit Domain event.lhai.ch
- Min. 2GB RAM, 10GB Speicher

---

## Schritt 1: Server vorbereiten

```bash
# Als root anmelden oder sudo verwenden
sudo su -

# System aktualisieren
apt update && apt upgrade -y
```

---

## Schritt 2: Anwendungsdateien übertragen

Übertragen Sie die Anwendungsdateien auf Ihren Server:

```bash
# Option A: Via SCP von Ihrem lokalen Rechner
scp -r /pfad/zu/tischplanung/* root@IHR-SERVER:/tmp/tischplanung-source/

# Option B: Via Git (falls in einem Repository)
cd /tmp
git clone <REPO-URL> tischplanung-source
```

Die Struktur sollte so aussehen:
```
/tmp/tischplanung-source/
├── backend/
│   ├── server.py
│   ├── requirements.txt
│   └── .env (wird vom Installer erstellt)
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env (wird vom Installer erstellt)
├── install.sh
└── memory/
```

---

## Schritt 3: Installation ausführen

```bash
# Installer ausführbar machen und starten
chmod +x /tmp/tischplanung-source/install.sh
cd /tmp/tischplanung-source
./install.sh
```

Der Installer:
- Installiert alle Abhängigkeiten (Node.js, Python, MongoDB, Nginx)
- Richtet die Anwendung unter `/opt/tischplanung` ein
- Erstellt systemd Services
- Installiert cloudflared

---

## Schritt 4: Cloudflare Tunnel einrichten

### 4.1 Bei Cloudflare anmelden
```bash
cloudflared tunnel login
```
Dies öffnet einen Browser-Link. Melden Sie sich an und autorisieren Sie den Tunnel.

### 4.2 Tunnel erstellen
```bash
cloudflared tunnel create tischplanung
```
**Notieren Sie sich die TUNNEL-ID** (z.B. `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

### 4.3 DNS-Eintrag erstellen
```bash
cloudflared tunnel route dns tischplanung event.lhai.ch
```

### 4.4 Tunnel-Konfiguration erstellen
```bash
nano ~/.cloudflared/config.yml
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

### 4.5 Tunnel als Service installieren
```bash
cloudflared service install
systemctl start cloudflared
systemctl enable cloudflared
```

---

## Schritt 5: Überprüfung

### Services prüfen
```bash
# Alle Services sollten "active (running)" zeigen
systemctl status mongod
systemctl status tischplanung-backend
systemctl status tischplanung-frontend
systemctl status cloudflared
```

### Logs ansehen
```bash
# Backend Logs
journalctl -u tischplanung-backend -f

# Frontend Logs
journalctl -u tischplanung-frontend -f

# Cloudflared Logs
journalctl -u cloudflared -f
```

### Lokaler Test
```bash
# Backend API testen
curl http://localhost:8001/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## Schritt 6: Fertig!

Öffnen Sie **https://event.lhai.ch** in Ihrem Browser.

**Login-Daten:**
- Benutzer: `admin`
- Passwort: `admin123`

---

## Fehlerbehebung

### MongoDB startet nicht
```bash
# Logs prüfen
journalctl -u mongod -n 50

# Neustart
systemctl restart mongod
```

### Backend startet nicht
```bash
# Logs prüfen
journalctl -u tischplanung-backend -n 50

# Manuell testen
cd /opt/tischplanung/backend
source venv/bin/activate
python -c "import server; print('OK')"
```

### Frontend Build fehlgeschlagen
```bash
cd /opt/tischplanung/frontend
yarn install
yarn build
```

### Cloudflare Tunnel funktioniert nicht
```bash
# Tunnel-Status prüfen
cloudflared tunnel info tischplanung

# Konfiguration validieren
cloudflared tunnel ingress validate

# Manuell testen
cloudflared tunnel run tischplanung
```

---

## Wartung

### Anwendung aktualisieren
```bash
cd /opt/tischplanung

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
systemctl restart tischplanung-backend

# Frontend
cd ../frontend
yarn install
yarn build
systemctl restart tischplanung-frontend
```

### Backup erstellen
```bash
# MongoDB Backup
mongodump --db tischplanung --out /backup/$(date +%Y%m%d)

# Wiederherstellen
mongorestore --db tischplanung /backup/DATUM/tischplanung
```

### Logs rotieren
```bash
# Automatisch via systemd/journald
journalctl --vacuum-time=30d
```

---

## Sicherheitshinweise

1. **Admin-Passwort ändern**: Nach der ersten Anmeldung das Passwort ändern
2. **Firewall aktiv**: Nur Ports 22, 80, 443 sind offen
3. **HTTPS**: Cloudflare Tunnel verschlüsselt automatisch
4. **Updates**: Regelmäßig `apt update && apt upgrade` ausführen
