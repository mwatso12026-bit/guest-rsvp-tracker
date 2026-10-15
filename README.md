# GuestRSVP

**Simple guest list & RSVP tracker for events that actually works.**

Stop managing wedding guests, party invites, and small events in spreadsheets and group chats. GuestRSVP gives you a clean place to track who’s coming, who’s not, and how many seats you still have.

---

## Features

- Create unlimited events
- Add guests with name, email, phone, status, plus-ones & dietary notes
- One-click status filters (Invited / Confirmed / Maybe / Declined)
- Live capacity tracking (confirmed + plus-ones)
- Export guest list to CSV
- Clean, fast, mobile-friendly interface
- Zero accounts, zero cloud dependency — runs fully on your machine

---

## Quick Setup (5 minutes)

### Requirements
- Node.js 18 or higher

### Install & Run

```bash
git clone https://github.com/mwatso12026-bit/guest-rsvp-tracker.git
cd guest-rsvp-tracker
npm install
npm start
```

Then open your browser:

**http://localhost:3000**

That’s it. The database is created automatically the first time you run it.

### Useful Commands

| Command       | What it does                  |
|---------------|-------------------------------|
| `npm start`   | Start the app                 |
| `npm run dev` | Start with auto-reload        |

---

## How to Use

1. Click **+ New Event** and fill in the details
2. Open the event and start adding guests
3. Update their status as RSVPs come in
4. Use the filters to see who’s confirmed
5. Hit **Export CSV** when you need the list

---

## Tech Stack

- **Backend:** Node.js + Express
- **Database:** SQLite (single file, no setup)
- **Frontend:** Vanilla HTML, CSS & JavaScript

No frameworks. No bloat. Just a working tool.

---

## Project Structure

```
guest-rsvp-tracker/
├── server.js          # Express API + static server
├── db.js              # SQLite setup & schema
├── public/
│   ├── index.html     # Main UI
│   ├── style.css      # Styles
│   └── app.js         # Frontend logic
├── package.json
└── README.md
```

---

## License

MIT — do whatever you want with it.
