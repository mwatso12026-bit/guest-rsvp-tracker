let currentEventId = null;
let currentFilter = '';
let editingGuestId = null;

// DOM elements
const eventsView = document.getElementById('events-view');
const eventView = document.getElementById('event-view');
const eventsList = document.getElementById('events-list');
const guestsList = document.getElementById('guests-list');
const eventTitle = document.getElementById('event-title');
const eventMeta = document.getElementById('event-meta');
const exportBtn = document.getElementById('export-btn');

// Modals
const eventModal = document.getElementById('event-modal');
const guestModal = document.getElementById('guest-modal');
const eventForm = document.getElementById('event-form');
const guestForm = document.getElementById('guest-form');

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
  loadEvents();

  document.getElementById('new-event-btn').addEventListener('click', () => openEventModal());
  document.getElementById('back-btn').addEventListener('click', showEventsView);
  document.getElementById('add-guest-btn').addEventListener('click', () => openGuestModal());
  document.getElementById('delete-event-btn').addEventListener('click', deleteCurrentEvent);
  document.getElementById('cancel-event').addEventListener('click', () => eventModal.classList.add('hidden'));
  document.getElementById('cancel-guest').addEventListener('click', () => guestModal.classList.add('hidden'));

  eventForm.addEventListener('submit', saveEvent);
  guestForm.addEventListener('submit', saveGuest);

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.status;
      loadGuests();
    });
  });
});

// ===================== EVENTS =====================
async function loadEvents() {
  const res = await fetch('/api/events');
  const events = await res.json();

  eventsList.innerHTML = '';

  if (events.length === 0) {
    eventsList.innerHTML = '<p style="color:#6b7280; text-align:center; padding:40px;">No events yet. Create your first one.</p>';
    return;
  }

  events.forEach(event => {
    const totalConfirmed = (event.confirmed_count || 0) + (event.confirmed_plus_ones || 0);
    const capacityText = event.max_capacity
      ? `${totalConfirmed} / ${event.max_capacity} confirmed`
      : `${totalConfirmed} confirmed`;

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${escapeHtml(event.name)}</h3>
      <div class="meta">
        ${event.date ? formatDate(event.date) : 'No date'} • ${event.location || 'No location'}
      </div>
      <div class="stats">${capacityText}</div>
    `;
    card.addEventListener('click', () => openEvent(event.id));
    eventsList.appendChild(card);
  });
}

async function openEvent(id) {
  currentEventId = id;
  currentFilter = '';
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.filter-btn[data-status=""]').classList.add('active');

  const res = await fetch(`/api/events/${id}`);
  const event = await res.json();

  eventTitle.textContent = event.name;
  const totalConfirmed = (event.confirmed_count || 0) + (event.confirmed_plus_ones || 0);
  eventMeta.innerHTML = `
    <div class="meta">
      ${event.date ? formatDate(event.date) : 'No date'} • ${event.location || 'No location'}<br>
      ${event.max_capacity ? `${totalConfirmed} / ${event.max_capacity} confirmed` : `${totalConfirmed} confirmed`}
    </div>
  `;

  exportBtn.href = `/api/events/${id}/export`;

  eventsView.classList.add('hidden');
  eventView.classList.remove('hidden');
  loadGuests();
}

function showEventsView() {
  currentEventId = null;
  eventView.classList.add('hidden');
  eventsView.classList.remove('hidden');
  loadEvents();
}

function openEventModal() {
  document.getElementById('event-modal-title').textContent = 'New Event';
  eventForm.reset();
  eventModal.classList.remove('hidden');
}

async function saveEvent(e) {
  e.preventDefault();
  const data = {
    name: document.getElementById('event-name').value.trim(),
    date: document.getElementById('event-date').value || null,
    location: document.getElementById('event-location').value.trim() || null,
    max_capacity: document.getElementById('event-capacity').value || null,
    notes: document.getElementById('event-notes').value.trim() || null
  };

  await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  eventModal.classList.add('hidden');
  loadEvents();
}

async function deleteCurrentEvent() {
  if (!confirm('Delete this event and all its guests?')) return;
  await fetch(`/api/events/${currentEventId}`, { method: 'DELETE' });
  showEventsView();
}

// ===================== GUESTS =====================
async function loadGuests() {
  if (!currentEventId) return;

  const url = currentFilter
    ? `/api/events/${currentEventId}/guests?status=${currentFilter}`
    : `/api/events/${currentEventId}/guests`;

  const res = await fetch(url);
  const guests = await res.json();

  guestsList.innerHTML = '';

  if (guests.length === 0) {
    guestsList.innerHTML = '<p style="color:#6b7280; text-align:center; padding:30px;">No guests yet.</p>';
    return;
  }

  guests.forEach(guest => {
    const card = document.createElement('div');
    card.className = 'card guest-card';
    card.innerHTML = `
      <div class="guest-info">
        <h3>${escapeHtml(guest.name)} ${guest.plus_ones > 0 ? `+${guest.plus_ones}` : ''}</h3>
        <div class="meta">
          ${guest.email || ''} ${guest.phone ? '• ' + guest.phone : ''}<br>
          ${guest.dietary_notes ? 'Dietary: ' + escapeHtml(guest.dietary_notes) : ''}
        </div>
        <span class="status-badge status-${guest.status}">${guest.status}</span>
      </div>
      <div class="guest-actions">
        <button class="btn secondary" onclick="editGuest(${guest.id})">Edit</button>
        <button class="btn danger" onclick="deleteGuest(${guest.id})">Delete</button>
      </div>
    `;
    guestsList.appendChild(card);
  });
}

function openGuestModal() {
  editingGuestId = null;
  document.getElementById('guest-modal-title').textContent = 'Add Guest';
  guestForm.reset();
  document.getElementById('guest-status').value = 'invited';
  document.getElementById('guest-plus').value = 0;
  guestModal.classList.remove('hidden');
}

async function editGuest(id) {
  const res = await fetch(`/api/events/${currentEventId}/guests`);
  const guests = await res.json();
  const guest = guests.find(g => g.id === id);
  if (!guest) return;

  editingGuestId = id;
  document.getElementById('guest-modal-title').textContent = 'Edit Guest';
  document.getElementById('guest-name').value = guest.name;
  document.getElementById('guest-email').value = guest.email || '';
  document.getElementById('guest-phone').value = guest.phone || '';
  document.getElementById('guest-status').value = guest.status;
  document.getElementById('guest-plus').value = guest.plus_ones || 0;
  document.getElementById('guest-dietary').value = guest.dietary_notes || '';
  document.getElementById('guest-notes').value = guest.notes || '';
  guestModal.classList.remove('hidden');
}

async function saveGuest(e) {
  e.preventDefault();
  const data = {
    name: document.getElementById('guest-name').value.trim(),
    email: document.getElementById('guest-email').value.trim() || null,
    phone: document.getElementById('guest-phone').value.trim() || null,
    status: document.getElementById('guest-status').value,
    plus_ones: parseInt(document.getElementById('guest-plus').value) || 0,
    dietary_notes: document.getElementById('guest-dietary').value.trim() || null,
    notes: document.getElementById('guest-notes').value.trim() || null
  };

  if (editingGuestId) {
    await fetch(`/api/guests/${editingGuestId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } else {
    await fetch(`/api/events/${currentEventId}/guests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  guestModal.classList.add('hidden');
  loadGuests();
  // refresh event meta (capacity)
  openEvent(currentEventId);
}

async function deleteGuest(id) {
  if (!confirm('Delete this guest?')) return;
  await fetch(`/api/guests/${id}`, { method: 'DELETE' });
  loadGuests();
  openEvent(currentEventId);
}

// ===================== HELPERS =====================
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Make edit/delete available globally for onclick
window.editGuest = editGuest;
window.deleteGuest = deleteGuest;
