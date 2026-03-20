# Event Tischplanung

Webapp für die Planung von Tischordnungen bei Events.

## Features

- Gästeverwaltung (Einzeln + CSV-Import)
- Drag & Drop Tischplan
- Einlass/Check-in mit Gruppen-Check-in
- Mitarbeiter-Verwaltung
- E-Mail-Versand mit Vorlagen
- Probefahrt-Anfragen (Lead-Formular)
- Besucher-Ansicht (Read-Only)
- PDF-Export

## Installation

### Voraussetzungen
- Ubuntu Server 24.04 LTS
- Root-Zugang

### Schnellinstallation

```bash
sudo su -
git clone https://github.com/lhaas-dev/event.git /opt/event
cd /opt/event
chmod +x install.sh
./install.sh
```

Siehe `INSTALL_ANLEITUNG.md` für detaillierte Schritte inkl. Cloudflare Tunnel Setup.

## Login

- **Benutzer:** admin
- **Passwort:** admin123

## Tech Stack

- **Frontend:** React, Tailwind CSS, dnd-kit
- **Backend:** FastAPI, MongoDB
- **Auth:** JWT

## Lizenz

Privat - Künzler & Sauber AG
