import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setUnauthorizedHandler, tokens } from '../services/api.js';
import { fromUser } from '../services/mappers.js';

const AuthContext = createContext(null);

// JWT auth against the NestJS backend: POST /auth/login, GET /auth/me, POST /auth/logout.
// Access/refresh tokens live in localStorage (see services/api.js); the user comes from the server, never from local data.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(tokens.hasSession());

  useEffect(() => {
    setUnauthorizedHandler(() => {
      tokens.clear();
      setUser(null);
    });
  }, []);

  // restore the session on page load
  useEffect(() => {
    if (!tokens.hasSession()) return undefined;
    let alive = true;
    api
      .get('/auth/me')
      .then((u) => alive && setUser(fromUser(u.user ?? u)))
      .catch(() => tokens.clear())
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (role, email, password) => {
    try {
      // customers sign in with the phone number their account was created with; admins with email
      const id = email.trim();
      const res = await api.login({ ...(role === 'customer' ? { phone: id } : { email: id }), password, role: role.toUpperCase() });
      tokens.set(res);
      const u = fromUser(res.user);
      setUser(u);
      return { ok: true, user: u };
    } catch (e) {
      return { ok: false, error: e.status === 401 || e.status === 403 ? 'Invalid email or password for this login type.' : e.message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* token may already be expired — still sign out locally */
    }
    tokens.clear();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
