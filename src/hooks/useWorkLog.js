import { useSyncExternalStore } from 'react';

// Work-status entries ("who is doing what on which project / lead").
// The backend has no endpoint for this yet, so entries are kept in this browser's localStorage behind this
// one hook; swap `load`/`save` for API calls when the endpoint exists and no page needs to change.
const KEY = 'macropage-crm-worklog';
let cache = null;
const listeners = new Set();

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
};
const save = (list) => {
  cache = list;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage blocked: keep in memory */
  }
  listeners.forEach((l) => l());
};
const get = () => (cache ??= load());
const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const uid = () => `w_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// entry: { id, scope: 'project'|'lead', refId, staffId, type, note, status, createdAt, updatedAt }
export function useWorkLog() {
  const entries = useSyncExternalStore(subscribe, get);
  return {
    entries,
    add: (e) => {
      const now = new Date().toISOString();
      save([{ ...e, id: uid(), createdAt: now, updatedAt: now }, ...get()]);
    },
    update: (id, patch) => save(get().map((x) => (x.id === id ? { ...x, ...patch, updatedAt: new Date().toISOString() } : x))),
    remove: (id) => save(get().filter((x) => x.id !== id)),
  };
}
