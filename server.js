const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===================== EVENTS =====================

// Get all events
app.get('/api/events', (req, res) => {
  const events = db.prepare(`
    SELECT e.*,
      (SELECT COUNT(*) FROM guests g WHERE g.event_id = e.id AND g.status = 'confirmed') as confirmed_count,
      (SELECT COALESCE(SUM(g.plus_ones), 0) FROM guests g WHERE g.event_id = e.id AND g.status = 'confirmed') as confirmed_plus_ones
    FROM events e
    ORDER BY e.date ASC, e.created_at DESC
  `).all();
  res.json(events);
});

// Get single event
app.get('/api/events/:id', (req, res) => {
  const event = db.prepare(`
    SELECT e.*,
      (SELECT COUNT(*) FROM guests g WHERE g.event_id = e.id AND g.status = 'confirmed') as confirmed_count,
      (SELECT COALESCE(SUM(g.plus_ones), 0) FROM guests g WHERE g.event_id = e.id AND g.status = 'confirmed') as confirmed_plus_ones
    FROM events e
    WHERE e.id = ?
  `).get(req.params.id);

  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

// Create event
app.post('/api/events', (req, res) => {
  const { name, date, location, max_capacity, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const result = db.prepare(`
    INSERT INTO events (name, date, location, max_capacity, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, date || null, location || null, max_capacity || null, notes || null);

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(event);
});

// Update event
app.put('/api/events/:id', (req, res) => {
  const { name, date, location, max_capacity, notes } = req.body;
  const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Event not found' });

  db.prepare(`
    UPDATE events
    SET name = ?, date = ?, location = ?, max_capacity = ?, notes = ?
    WHERE id = ?
  `).run(
    name ?? existing.name,
    date ?? existing.date,
    location ?? existing.location,
    max_capacity ?? existing.max_capacity,
    notes ?? existing.notes,
    req.params.id
  );

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  res.json(event);
});

// Delete event
app.delete('/api/events/:id', (req, res) => {
  const result = db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Event not found' });
  res.json({ success: true });
});

// ===================== GUESTS =====================

// Get guests for an event (with optional status filter)
app.get('/api/events/:eventId/guests', (req, res) => {
  const { status } = req.query;
  let guests;

  if (status) {
    guests = db.prepare(`
      SELECT * FROM guests
      WHERE event_id = ? AND status = ?
      ORDER BY name ASC
    `).all(req.params.eventId, status);
  } else {
    guests = db.prepare(`
      SELECT * FROM guests
      WHERE event_id = ?
      ORDER BY name ASC
    `).all(req.params.eventId);
  }

  res.json(guests);
});

// Create guest
app.post('/api/events/:eventId/guests', (req, res) => {
  const { name, email, phone, status, plus_ones, dietary_notes, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const event = db.prepare('SELECT id FROM events WHERE id = ?').get(req.params.eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const result = db.prepare(`
    INSERT INTO guests (event_id, name, email, phone, status, plus_ones, dietary_notes, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.params.eventId,
    name,
    email || null,
    phone || null,
    status || 'invited',
    plus_ones || 0,
    dietary_notes || null,
    notes || null
  );

  const guest = db.prepare('SELECT * FROM guests WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(guest);
});

// Update guest
app.put('/api/guests/:id', (req, res) => {
  const { name, email, phone, status, plus_ones, dietary_notes, notes } = req.body;
  const existing = db.prepare('SELECT * FROM guests WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Guest not found' });

  db.prepare(`
    UPDATE guests
    SET name = ?, email = ?, phone = ?, status = ?, plus_ones = ?, dietary_notes = ?, notes = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name ?? existing.name,
    email ?? existing.email,
    phone ?? existing.phone,
    status ?? existing.status,
    plus_ones ?? existing.plus_ones,
    dietary_notes ?? existing.dietary_notes,
    notes ?? existing.notes,
    req.params.id
  );

  const guest = db.prepare('SELECT * FROM guests WHERE id = ?').get(req.params.id);
  res.json(guest);
});

// Delete guest
app.delete('/api/guests/:id', (req, res) => {
  const result = db.prepare('DELETE FROM guests WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Guest not found' });
  res.json({ success: true });
});

// ===================== CSV EXPORT =====================

app.get('/api/events/:eventId/export', (req, res) => {
  const event = db.prepare('SELECT name FROM events WHERE id = ?').get(req.params.eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const guests = db.prepare(`
    SELECT name, email, phone, status, plus_ones, dietary_notes, notes
    FROM guests WHERE event_id = ?
    ORDER BY name ASC
  `).all(req.params.eventId);

  const header = 'Name,Email,Phone,Status,Plus Ones,Dietary Notes,Notes\n';
  const rows = guests.map(g =>
    [g.name, g.email, g.phone, g.status, g.plus_ones, g.dietary_notes, g.notes]
      .map(v => `"${(v || '').toString().replace(/"/g, '""')}"`)
      .join(',')
  ).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${event.name.replace(/[^a-z0-9]/gi, '_')}_guests.csv"`);
  res.send(header + rows);
});

// Public RSVP endpoint (simple)
app.post('/api/public/rsvp', (req, res) => {
  const { event_id, name, email, phone, status, plus_ones, dietary_notes } = req.body;
  if (!event_id || !name) return res.status(400).json({ error: 'event_id and name are required' });

  const event = db.prepare('SELECT id FROM events WHERE id = ?').get(event_id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const result = db.prepare(`
    INSERT INTO guests (event_id, name, email, phone, status, plus_ones, dietary_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    event_id,
    name,
    email || null,
    phone || null,
    status || 'confirmed',
    plus_ones || 0,
    dietary_notes || null
  );

  res.status(201).json({ success: true, id: result.lastInsertRowid });
});

// Fallback to frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Guest RSVP Tracker running at http://localhost:${PORT}`);
});
