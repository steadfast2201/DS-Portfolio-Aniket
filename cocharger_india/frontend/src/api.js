/**
 * src/api.js
 * Central "Waiter" file that talks to our Django Backend (http://127.0.0.1:8000/api/)
 */

const API_BASE = 'http://127.0.0.1:8000/api';

export async function fetchChargers(filters = {}) {
  const params = new URLSearchParams();
  if (filters.connector) params.append('connector', filters.connector);
  if (filters.segment) params.append('segment', filters.segment);
  if (filters.vehicles) params.append('vehicles', filters.vehicles);

  const res = await fetch(`${API_BASE}/chargers/?${params.toString()}`);
  return res.json();
}

export async function fetchProfiles() {
  const res = await fetch(`${API_BASE}/profiles/`);
  return res.json();
}

export async function fetchVehicles() {
  const res = await fetch(`${API_BASE}/vehicles/`);
  return res.json();
}

export async function fetchBookings() {
  const res = await fetch(`${API_BASE}/bookings/`);
  return res.json();
}

export async function fetchHostAnalytics() {
  const res = await fetch(`${API_BASE}/host-analytics/`);
  return res.json();
}

export async function createBooking(payload) {
  const res = await fetch(`${API_BASE}/bookings/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function startChargingSession(bookingId) {
  const res = await fetch(`${API_BASE}/bookings/${bookingId}/start_session/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initial_meter_kwh: 100.0 }),
  });
  return res.ok;
}

export async function stopChargingSession(bookingId, kwh) {
  const res = await fetch(`${API_BASE}/bookings/${bookingId}/stop_session/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ total_energy_kwh: kwh, end_reason: 'TIMER_EXPIRY' }),
  });
  return res.ok;
}

export async function createHostCharger(payload) {
  const res = await fetch(`${API_BASE}/chargers/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function verifyGatePassPin(code, markArrived = false) {
  const res = await fetch(`${API_BASE}/verify-gate-pass/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, mark_arrived: markArrived }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}



export async function loginUser(identifier, password) {
  const res = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function registerUser(payload) {
  const res = await fetch(`${API_BASE}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}
