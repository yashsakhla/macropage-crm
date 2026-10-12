import { useEffect } from 'react';
import { X } from 'lucide-react';
import { initials } from '../../utils/format.js';

export function Modal({ title, onClose, children, footer, size = '' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size}`} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, sub, color = '#f26522' }) {
  return (
    <div className="card stat">
      <div className="stat-icon" style={{ background: `${color}1a`, color }}>
        <Icon size={22} />
      </div>
      <div className="grow">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

export function Badge({ color = '#64748b', children }) {
  return (
    <span className="badge" style={{ background: `${color}1a`, color }}>
      <i style={{ background: color }} />
      {children}
    </span>
  );
}

export function ProgressBar({ value = 0, color, thin }) {
  return (
    <div className={`progress ${thin ? 'thin' : ''}`}>
      <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, ...(color ? { background: color } : {}) }} />
    </div>
  );
}

export function Avatar({ name = '', large }) {
  return (
    <span className={`avatar ${large ? 'lg' : ''}`} title={name}>
      {initials(name) || '?'}
    </span>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button key={t.key} type="button" className={`tab ${value === t.key ? 'active' : ''}`} onClick={() => onChange(t.key)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{text}</p>
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}

export function Field({ label, children, full }) {
  return (
    <div className={`field ${full ? 'full' : ''}`}>
      <label>{label}</label>
      {children}
    </div>
  );
}

// Horizontal bar list: items = [{label, value, color}]
export function HBars({ items, format, max }) {
  const top = max ?? Math.max(1, ...items.map((i) => i.value));
  return (
    <div>
      {items.map((i) => (
        <div className="hbar" key={i.label}>
          <div className="lbl" title={i.label}>{i.label}</div>
          <div className="track">
            <div className="fill" style={{ width: `${(i.value / top) * 100}%`, background: i.color || '#f26522' }} />
          </div>
          <div className="right bold">{format ? format(i.value) : i.value}</div>
        </div>
      ))}
    </div>
  );
}

// Grouped vertical bars: series = [{label, revenue, expense}]
export function MonthBars({ series, format }) {
  const top = Math.max(1, ...series.flatMap((s) => [s.revenue, s.expense]));
  return (
    <div>
      <div className="bars">
        {series.map((s) => (
          <div className="bar-group" key={s.key}>
            <div className="bar-pair">
              <div className="bar" style={{ height: `${(s.revenue / top) * 100}%`, background: '#16a34a' }} title={`Revenue ${format(s.revenue)}`} />
              <div className="bar" style={{ height: `${(s.expense / top) * 100}%`, background: '#f26522' }} title={`Expenses ${format(s.expense)}`} />
            </div>
            <div className="small muted">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="legend" style={{ marginTop: 10 }}>
        <span><i style={{ background: '#16a34a' }} />Revenue received</span>
        <span><i style={{ background: '#f26522' }} />Expenses</span>
      </div>
    </div>
  );
}

export function PageStatus({ ready, error, onRetry }) {
  if (error) {
    return (
      <div className="card">
        <div className="empty">
          <h3>Could not load data</h3>
          <p>{error}</p>
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={onRetry}>Retry</button>
        </div>
      </div>
    );
  }
  return ready ? null : <div className="card"><div className="empty"><p>Loading…</p></div></div>;
}
