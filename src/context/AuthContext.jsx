import { createContext, useContext, useMemo, useState } from 'react';
import { useData } from './DataContext.jsx';

const KEY = 'macropage-crm-session';
const AuthContext = createContext(null);

// Demo-only auth against seeded users. Real auth = JWT from the NestJS backend.
export function AuthProvider({ children }) {
  const { data } = useData();
  const [userId, setUserId] = useState(() => localStorage.getItem(KEY));

  const user = useMemo(() => data.users.find((u) => u.id === userId) || null, [data.users, userId]);

  const login = (role, email, password) => {
    const found = data.users.find(
      (u) => u.role === role && u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
    );
    if (!found) return { ok: false, error: 'Invalid email or password for this login type.' };
    localStorage.setItem(KEY, found.id);
    setUserId(found.id);
    return { ok: true, user: found };
  };

  const logout = () => {
    localStorage.removeItem(KEY);
    setUserId(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
