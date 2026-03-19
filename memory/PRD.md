# Tischplanung – PRD

## Original Problem Statement
Einfache Webapp für Tischplanung bei Events. Gäste hinzufügen als Liste und an Tischen platzieren. Anzahl Tische einstellbar, 6 Personen pro Tisch (änderbar). Drag & Drop. PDF-Export mit grafischer Darstellung. Login mit Benutzername und Passwort.

## User Choices
- Sprache: Deutsch
- Gäste: Einzeln per Vor- und Nachname + CSV-Import + Alter (Erwachsener/Kind) + Begleitperson
- Tische: Rund
- Speicherung: Datenbank
- Auth: Nur Login (kein Register), Admin erstellt Benutzer
- Login-Bild: Garage Künzler & Sauber AG
- Event-Name in der App definierbar

## Architecture
- **Frontend**: React + Tailwind CSS + @dnd-kit (drag & drop) + html2canvas/jspdf (PDF)
- **Backend**: FastAPI + MongoDB (Motor async)
- **Auth**: JWT (HS256, 24h) + bcrypt + Rollen (admin/user)
- **Design**: Elegant Minimalist – Sage Green / Gold / White palette

## Core Entities
- **User**: username, hashed_password, role (admin/user)
- **Event**: user_id, name, table_count, seats_per_table
- **Guest**: event_id, first_name, last_name, guest_type (erwachsener/kind), companion_of (optional guest_id)
- **SeatingPlan**: event_id, tables (2D array)

## Pages / Routes
| Route | Seite |
|-------|-------|
| `/` | Login (kein Register) |
| `/dashboard` | Event-Übersicht |
| `/admin` | Benutzerverwaltung (nur Admin) |
| `/event/:id/gaeste` | Gäste-Verwaltung |
| `/event/:id/tischplan` | Tischplan (Drag & Drop) |
| `/event/:id/export` | Export / PDF |

## Default Admin
- Benutzername: **admin**
- Passwort: **admin123**
- Wird automatisch beim ersten Start erstellt

## API Endpoints
- `POST /api/auth/login` – Anmelden, JWT erhalten
- `GET /api/auth/me` – Aktueller Benutzer (inkl. Rolle)
- `GET/POST /api/admin/users` – Benutzer verwalten (Admin)
- `DELETE /api/admin/users/:id` – Benutzer löschen
- `PUT /api/admin/users/:id/password` – Passwort ändern
- `GET/POST /api/events` – Events
- `GET/PUT/DELETE /api/events/:id` – Event CRUD
- `GET/POST /api/events/:id/guests` – Gäste
- `PUT/DELETE /api/events/:id/guests/:gid` – Gast CRUD
- `POST /api/events/:id/guests/import` – CSV-Import
- `GET/PUT /api/events/:id/seating` – Sitzplan

## What's Been Implemented

### Phase 1 (Initial)
- [x] Login-Seite (Split-Screen) + Dashboard + Gästeverwaltung (CSV-Import)
- [x] Tischplan-Seite mit runden Tischen + Drag & Drop
- [x] Sitzplan speichern (Datenbank)
- [x] Export-Seite: SVG-Grafik + Sitzliste + PDF-Download + Drucken

### Phase 2 (Update)
- [x] Login-only (kein Register mehr)
- [x] Garage-Bild auf Login-Seite (Künzler & Sauber AG)
- [x] Vorname + Nachname bei jedem Tisch-Sitzplatz sichtbar
- [x] Gast-Typ: Erwachsener (grün) / Kind (blau)
- [x] Begleitperson-Beziehung: Anzeige in Gästeliste + Export
- [x] Gäste inline editieren
- [x] Admin-Panel (/admin): Benutzer erstellen/löschen/Passwort ändern
- [x] Admin-Badge in Header für Admin-Benutzer
- [x] Rollen-Schutz: /admin nur für Admins

## Test Results
- Backend: 100% (16/16 Tests)
- Frontend: 100% (alle Features verifiziert)

## Prioritized Backlog
### P1
- Tische individuell benennen (z.B. "VIP-Tisch")
- Statistik-Dashboard (Gesamt-Kapazität vs. Gäste)
- Drag & Drop auf Touch-Geräten optimieren

### P2
- QR-Code pro Tisch generieren
- Bulk-Löschen von Gästen
- Gäste zwischen Events übertragen

### P3
- E-Mail-Einladungen
- Gäste-App (Gast sucht eigenen Tisch per QR)
