const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
export const money = (n) => inr.format(Number(n) || 0);

export const moneyShort = (n) => {
  const v = Number(n) || 0;
  const a = Math.abs(v);
  const s = v < 0 ? '-' : '';
  const trim = (x, d) => x.toFixed(d).replace(/\.?0+$/, '');
  if (a >= 1e7) return `${s}₹${trim(a / 1e7, 2)}Cr`;
  if (a >= 1e5) return `${s}₹${trim(a / 1e5, 2)}L`;
  if (a >= 1e3) return `${s}₹${trim(a / 1e3, 1)}K`;
  return `${s}₹${a}`;
};

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const iso = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
export const todayISO = () => iso(new Date());
export const addDaysISO = (n, from = new Date()) => {
  const d = new Date(from);
  d.setDate(d.getDate() + n);
  return iso(d);
};
export const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

export const sum = (arr, pick = (x) => x) => arr.reduce((s, x) => s + (Number(pick(x)) || 0), 0);
