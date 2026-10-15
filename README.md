# Guest List + RSVP Tracker

Simple, focused tool for managing event guest lists and RSVPs.

Built for weddings, parties, small conferences, community events, dinners — anywhere people are still stuck using spreadsheets and group chats.

## Features (Working MVP)
- Create / view / delete events
- Add / edit / delete guests
- Status tracking: invited, confirmed, maybe, declined
- Plus-ones support
- Dietary notes
- Capacity counter (confirmed + plus-ones)
- Filter guests by status
- One-click CSV export
- Clean mobile-friendly UI

## Tech Stack
- Node.js + Express
- SQLite (better-sqlite3) — zero config
- Vanilla HTML / CSS / JS frontend

## Quick Start

```bash
git clone https://github.com/mwatso12026-bit/guest-rsvp-tracker.git
cd guest-rsvp-tracker
npm install
npm start
```

Open http://localhost:3000

That's it. The SQLite database (`rsvp.db`) is created automatically on first run.

## API Endpoints

### Events
- `GET /api/events` — list all events
- `GET /api/events/:id` — single event + capacity stats
- `POST /api/events` — create event
- `PUT /api/events/:id` — update event
- `DELETE /api/events/:id` — delete event (and its guests)

### Guests
- `GET /api/events/:eventId/guests` — list guests (optional `?status=`)
- `POST /api/events/:eventId/guests` — add guest
- `PUT /api/guests/:id` — update guest
- `DELETE /api/guests/:id` — delete guest

### Other
- `GET /api/events/:eventId/export` — CSV download
- `POST /api/public/rsvp` — public RSVP endpoint (for future form)

## Database Schema

**events**
- id, name, date, location, max_capacity, notes, created_at

**guests**
- id, event_id, name, email, phone, status, plus_ones, dietary_notes, notes, updated_at

## License
MIT
