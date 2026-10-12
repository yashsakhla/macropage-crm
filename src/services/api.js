// Fetch wrapper for the MACROPAGE NestJS backend (see BACKEND_PROMPT.md).
// Sends the JWT access token, transparently refreshes it once on 401 (refresh token is rotated server-side).

const BASE = (import.meta.env.VITE_API_URL || 'https://macropage-crm.onrender.com/api').replace(/\/$/, '');

const ACCESS = 'macropage-crm-access';
const REFRESH = 'macropage-crm-refresh';

const read = (k) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k, v) => {
  try {
    if (v) localStorage.setItem(k, v);
    else localStorage.removeItem(k);
  } catch {
    /* storage blocked */
  }
};

export const tokens = {
  set: ({ accessToken, refreshToken }) => {
    write(ACCESS, accessToken);
    write(REFRESH, refreshToken);
  },
  clear: () => {
    write(ACCESS, null);
    write(REFRESH, null);
  },
  hasSession: () => Boolean(read(ACCESS) || read(REFRESH)),
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const errorMessage = async (res) => {
  const body = await res.json().catch(() => ({}));
  const m = body.message;
  return (Array.isArray(m) ? m.join(', ') : m) || `Request failed (${res.status})`;
};

const qs = (params) => {
  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.append(k, v);
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
};

let refreshing = null;
const refreshTokens = () => {
  if (!refreshing) {
    refreshing = (async () => {
      const refreshToken = read(REFRESH);
      if (!refreshToken) return false;
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => null);
      if (!res || !res.ok) return false;
      tokens.set(await res.json());
      return true;
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
};

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

async function request(path, { method = 'GET', body, params, auth = true } = {}, retried = false) {
  const token = read(ACCESS);
  let res;
  try {
    res = await fetch(`${BASE}${path}${qs(params)}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
  }

  if (res.status === 401 && auth && !retried && (await refreshTokens())) {
    return request(path, { method, body, params, auth }, true);
  }
  if (res.status === 401 && auth) onUnauthorized();
  if (!res.ok) throw new ApiError(await errorMessage(res), res.status);
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// list endpoints return either an array or { data, meta } — always hand back the array
export const rows = (r) => (Array.isArray(r) ? r : r?.data ?? []);

export const api = {
  get: (p, params) => request(p, { params }),
  list: async (p, params) => rows(await request(p, { params: { limit: 500, ...params } })),
  post: (p, body = {}) => request(p, { method: 'POST', body }),
  patch: (p, body = {}) => request(p, { method: 'PATCH', body }),
  put: (p, body = {}) => request(p, { method: 'PUT', body }),
  del: (p) => request(p, { method: 'DELETE' }),
  login: (body) => request('/auth/login', { method: 'POST', body, auth: false }),
};
