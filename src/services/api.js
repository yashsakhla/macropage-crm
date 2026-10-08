// Thin fetch wrapper for the NestJS backend.
// The demo app currently runs on local state (src/context/DataContext.jsx).
// When the backend is ready, call these from the DataContext actions instead of mutating local state.

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const getToken = () => localStorage.getItem('macropage-crm-token');

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: 'POST', body }),
  patch: (p, body) => request(p, { method: 'PATCH', body }),
  del: (p) => request(p, { method: 'DELETE' }),
};
