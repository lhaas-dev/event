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
- **Auth**: JWT (HS256, 24h) + bcrypt + Rollen (admin/user/visitor)
- **Design**: Elegant Minimalist – Sage Green / Gold / White palette

## Core Entities
- **User**: username, hashed_password, role (admin/user/visitor)
- **Event**: user_id, name, table_count, seats_per_table
- **Guest**: event_id, first_name, last_name, guest_type (erwachsener/kind), companion_of, is_staff, notes, vehicle, license_plate, email, salutation, phone, personal_greeting, checked_in
- **MenuItem**: event_id, name, description, category (essen/getraenke), price, allergens
- **SeatingPlan**: event_id, tables (2D array)
- **EmailTemplate**: user_id, name, subject, body

## Pages / Routes
| Route | Seite |
|-------|-------|
| `/` | Login (kein Register) |
| `/dashboard` | Event-Übersicht |
| `/admin` | Benutzerverwaltung (nur Admin) |
| `/settings` | E-Mail-Einstellungen (SMTP) |
| `/settings/vorlagen` | E-Mail-Vorlagen verwalten |
| `/event/:id/gaeste` | Gäste-Verwaltung |
| `/event/:id/mitarbeiter` | Mitarbeiter-Verwaltung |
| `/event/:id/fahrzeug` | Probefahrt-Anfragen |
| `/event/:id/tischplan` | Tischplan (Drag & Drop) |
| `/event/:id/einlass` | Einlass (Gäste abhaken) |
| `/event/:id/menu` | Menü-Verwaltung (Essen & Getränke) |
| `/event/:id/export` | Export / PDF |
| `/besucher/:id` | Besucher-Ansicht (Tisch-Suche) |
| `/besucher/:id/menu` | Besucher-Menü-Ansicht |

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

### Phase 4 (Mitarbeiter, Menü, Besucher-Ansicht) - 19.03.2026
- [x] **Mitarbeiter-Liste**: Separate Seite für Mitarbeiter und deren Begleiter (werden an Tischen mit Gästen platziert)
- [x] **Gäste alphabetisch sortiert**: Nach Nachname sortiert
- [x] **Kompaktere Check-in-Liste**: Kleinere Zeilen mit Abkürzungen (E/K, MA)
- [x] **Neue Gast-Felder**: Notizen, Fahrzeug, Kennzeichen für Gäste und Mitarbeiter
- [x] **Menü-Tab**: Essen und Getränke verwalten (Name, Beschreibung, Preis, Allergene)
- [x] **Besucher-Ansicht**: Read-only Ansicht wo Gäste ihren Tisch finden können
  - Visitor-Rolle für Benutzer
  - Event-Auswahl
  - Namenssuche zeigt zugewiesenen Tisch
  - Menü-Ansicht
  - **Tischübersicht mit allen Tischen und deren Gästen**
- [x] **Dashboard Besucher-Vorschau**: Eye-Icon öffnet Besucher-Ansicht für jedes Event
- [x] **Dashboard zeigt Gäste und Mitarbeiter getrennt**: Separate Zähler für Gäste und Mitarbeiter
- [x] **Mitarbeiter nicht auf Einlass-Liste**: Nur Gäste werden beim Check-in angezeigt
- [x] **Mitarbeiter mit anderer Farbe im Tischplan**: Amber/Orange Farbe für Mitarbeiter zur besseren Unterscheidung

### Phase 5 (E-Mail, Fahrzeug/Probefahrt) - 20.03.2026
- [x] **Gast-Felder erweitert**: E-Mail-Adresse, Anrede (Herr/Frau/Dr./Prof.), Telefonnummer
- [x] **E-Mail-Einstellungen**: SMTP-Server konfigurieren unter /settings
  - SMTP-Host, Port, Benutzername, Passwort
  - Absender-E-Mail und -Name
  - TLS/STARTTLS Unterstützung
- [x] **E-Mail an Gäste senden**: Checkbox-Auswahl in Gästeliste
  - "Alle mit E-Mail" Button
  - E-Mail-Modal mit Betreff und Nachricht
  - Platzhalter: {anrede}, {vorname}, {nachname}, {name}
- [x] **Fahrzeug-Tab (Probefahrt-Lead-Formular)**:
  - Gast auswählen aus Dropdown
  - Telefonnummer (wird automatisch übernommen)
  - Fahrzeugmodell auswählen (verwaltet unter "Modelle verwalten")
  - Gewünschtes Datum und Zeit
  - Notizen
  - "Probefahrt bestätigen" Button
  - Liste der Probefahrt-Anfragen mit Status

### Phase 6 (Einlass- & E-Mail-Verbesserungen) - 20.03.2026
- [x] **Gruppen-Check-in**: Gast und alle Begleitpersonen mit einem Klick einchecken
  - "Gruppe" Button erscheint bei Hauptgästen mit Begleitern
  - Backend-Endpoint: PUT /api/events/{id}/guests/{id}/group-checkin
- [x] **E-Mail-Vorlagen**: Vorlagen erstellen, bearbeiten und löschen
  - Neue Seite /settings/vorlagen
  - CRUD API: /api/email-templates
  - Vorlage im E-Mail-Modal auswählbar
- [x] **Persönliche Anrede**: Neues Feld "Persönliche Anrede" (z.B. "Lieber Stefan")
  - Im Gast-Formular hinzufügen/bearbeiten
  - Platzhalter {persoenliche_anrede} für E-Mails
- [x] **E-Mail-Einstellungen sichtbarer**: Direkter Link im Dashboard-Header + Quick-Access-Card

## Test Credentials
- **Admin**: admin / admin123
- **Besucher**: gast / gast123

## Prioritized Backlog
### P1
- Tische individuell benennen (z.B. "VIP-Tisch")

### P2
- QR-Code pro Tisch generieren
- Statistik-Dashboard pro Event
- PDF-Export verbessern
- Probefahrt-Status-Verwaltung (bestätigt, abgeschlossen)

### P3
- E-Mail-Einladungen / QR-Gäste-App
