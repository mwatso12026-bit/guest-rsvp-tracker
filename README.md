# Guest List + RSVP Tracker

Simple, focused tool for managing event guest lists and RSVPs.

Built for weddings, parties, small conferences, community events, dinners — anywhere people are still stuck using spreadsheets and group chats.

## Core Features (v1)
- Create events
- Add guests with name, email/phone, status, plus-ones, dietary notes
- Filter by status (invited / confirmed / declined / maybe)
- Capacity tracking
- Export to CSV
- Optional public RSVP form (later)

## Database Schema (starting point)

### Events
| Column       | Type         | Notes                    |
|--------------|--------------|--------------------------|
| id           | uuid / serial| Primary key              |
| name         | text         | Event name               |
| date         | date/timestamp | Event date             |
| location     | text         | Optional                 |
| max_capacity | integer      | Optional                 |
| notes        | text         | Optional                 |
| created_at   | timestamp    |                          |

### Guests
| Column       | Type         | Notes                              |
|--------------|--------------|------------------------------------|
| id           | uuid / serial| Primary key                        |
| event_id     | fk           | References Events                  |
| name         | text         | Required                           |
| email        | text         | Optional                           |
| phone        | text         | Optional                           |
| status       | enum/text    | invited, confirmed, declined, maybe|
| plus_ones    | integer      | Default 0                          |
| dietary_notes| text         | Optional                           |
| notes        | text         | Optional                           |
| updated_at   | timestamp    |                                    |

That's it. Keep it this lean for the first version.

## Tech Stack Suggestions
- Backend: whatever you're fastest with (Node, Python, etc.)
- Database: Postgres / SQLite for simplicity
- Frontend: simple admin UI + optional public form

## Next Steps
1. Set up the database tables
2. Build basic CRUD for Events and Guests
3. Add status filters and capacity count
4. Ship a usable internal version first
5. Add public RSVP form later

## License
MIT (or whatever you prefer)
