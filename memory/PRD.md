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
- iPad-optimiert
- Einlass-Funktion (Gäste abhaken)
- Begleitpersonen nach Hauptgast in Liste

## Architecture
- **Frontend**: React + Tailwind CSS + @dnd-kit + html2canvas/jspdf
- **Backend**: FastAPI + MongoDB (Motor async)
- **Auth**: JWT (HS256, 24h) + bcrypt + Rollen (admin/user)
- **Design**: Elegant Minimalist – Sage Green / Gold / White palette

## Core Entities
- **User**: username, hashed_password, role (admin/user)
- **Event**: user_id, name, table_count, seats_per_table
- **Guest**: event_id, first_name, last_name, guest_type (erwachsener/kind), companion_of (optional guest_id), checked_in (bool)
- **SeatingPlan**: event_id, tables (2D array)

## Pages / Routes
| Route | Seite |
|-------|-------|
| `/` | Login (kein Register) |
| `/dashboard` | Event-Übersicht |
| `/admin` | Benutzerverwaltung (nur Admin) |
| `/event/:id/gaeste` | Gäste-Verwaltung |
| `/event/:id/tischplan` | Tischplan (Drag & Drop) |
| `/event/:id/einlass` | Einlass (Gäste abhaken) |
| `/event/:id/export` | Export / PDF |

## Default Admin
- Benutzername: **admin**
- Passwort: **admin123**
- Wird automatisch beim ersten Start erstellt

## What's Been Implemented

### Phase 1 (Initial)
- [x] Login/Dashboard/Gästeverwaltung (CSV-Import)
- [x] Tischplan mit Drag & Drop (runde Tische)
- [x] Export mit SVG + PDF-Download

### Phase 2
- [x] Login-only (kein Register)
- [x] Garage-Bild auf Login-Seite
- [x] Vorname + Nachname bei jedem Tisch-Sitzplatz
- [x] Gast-Typ: Erwachsener/Kind (Farbkodierung)
- [x] Begleitperson-Beziehung + Anzeige
- [x] Gäste inline editieren
- [x] Admin-Panel: Benutzer erstellen/löschen/Passwort

### Phase 3 (iPad + Einlass)
- [x] **iPad-Optimierung**: Responsive Navigation (Icons auf kleinen Screens, Labels auf grossen), kollabierbare Sidebar im Tischplan
- [x] **Einlass-Seite** (/einlass): Gäste abhaken, Fortschrittsbalken, Suchfilter, Zurücksetzen-Button
- [x] **Begleitpersonen nach Hauptgast**: In der Gästeliste erscheinen Begleitpersonen immer unter/nach dem Hauptgast, leicht eingerückt
- [x] Tischplan-Container 300px (passt 3 Spalten auf iPad Landscape)

## Prioritized Backlog
### P1
- Tische individuell benennen (z.B. "VIP-Tisch")
- Einlass: Komplett-Check-in einer Begleitgruppe mit einem Tap

### P2
- QR-Code pro Tisch generieren
- Statistik-Dashboard pro Event

### P3
- E-Mail-Einladungen / QR-Gäste-App
