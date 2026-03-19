# Tischplanung – PRD

## Original Problem Statement
Einfache Webapp für Tischplanung bei Events. Gäste hinzufügen als Liste und an Tischen platzieren. Anzahl Tische einstellbar, 6 Personen pro Tisch (änderbar). Drag & Drop. PDF-Export mit grafischer Darstellung. Login mit Benutzername und Passwort.

## User Choices
- Sprache: Deutsch
- Gäste: Einzeln per Vor- und Nachname eingeben + CSV-Import
- Tische: Rund
- Speicherung: Datenbank
- Auth: Login mit Benutzername und Passwort (inkl. Registrierung)
- Event-Name in der App definierbar

## Architecture
- **Frontend**: React + Tailwind CSS + @dnd-kit (drag & drop) + html2canvas/jspdf (PDF)
- **Backend**: FastAPI + MongoDB (Motor async)
- **Auth**: JWT (HS256, 24h Ablauf) + bcrypt Passwort-Hashing
- **Design**: Elegant Minimalist – Sage Green / Gold / White palette

## Core Entities
- **User**: username, hashed_password
- **Event**: user_id, name, table_count, seats_per_table
- **Guest**: event_id, first_name, last_name
- **SeatingPlan**: event_id, tables (2D array: tables[tableIdx][seatIdx] = guest_id | null)

## Pages / Routes
| Route | Seite |
|-------|-------|
| `/` | Login / Registrieren |
| `/dashboard` | Event-Übersicht |
| `/event/:id/gaeste` | Gäste-Verwaltung |
| `/event/:id/tischplan` | Tischplan (Drag & Drop) |
| `/event/:id/export` | Export / PDF |

## API Endpoints
- `POST /api/auth/register` – Benutzer registrieren
- `POST /api/auth/login` – Anmelden, JWT erhalten
- `GET /api/auth/me` – Aktueller Benutzer
- `GET/POST /api/events` – Events auflisten / erstellen
- `GET/PUT/DELETE /api/events/:id` – Event details / bearbeiten / löschen
- `GET/POST /api/events/:id/guests` – Gäste auflisten / hinzufügen
- `PUT/DELETE /api/events/:id/guests/:gid` – Gast bearbeiten / löschen
- `POST /api/events/:id/guests/import` – CSV-Import
- `GET/PUT /api/events/:id/seating` – Sitzplan laden / speichern

## What's Been Implemented (2025-02-xx)
- [x] Login- und Registrierungsseite (Split-Screen, elegant)
- [x] Dashboard mit Event-Karten (Erstellen, Löschen)
- [x] Gästeverwaltung: Einzeln hinzufügen + CSV-Import + Löschen
- [x] Event-Einstellungen editierbar (Name, Tischanzahl, Plätze/Tisch)
- [x] Tischplan-Seite mit rundem SVG/CSS-Tischen
- [x] Drag & Drop (Gäste verschieben, zwischen Tischen tauschen)
- [x] Sitzplan speichern (Datenbank)
- [x] Export-Seite: SVG-Grafik aller Tische + Sitzliste nach Tisch
- [x] PDF-Download (html2canvas + jspdf) + Drucken (window.print())
- [x] JWT-Auth (24h), bcrypt Passwörter
- [x] Vollständig auf Deutsch

## Test Results (Iteration 1)
- Backend: 100% (15/15 Tests)
- Frontend: 95% (kleinere Playwright Modal-Interception behoben)

## Prioritized Backlog
### P1 (Nächste Features)
- Tische im Sitzplan umsortieren / benennen
- Gäste bearbeiten (Name ändern)
- Bulk-Löschen von Gästen

### P2 (Nice-to-have)
- Mehrere Events gleichzeitig planen
- Tischnotizen / Sonderwünsche
- QR-Code pro Tisch generieren
- Tischplan-Vorschau beim Export

### P3 (Zukunft)
- E-Mail-Einladungen
- Gäste-App (Gast sucht eigenen Tisch)
- Mehrere Nutzer pro Account
