import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Field, Modal } from '../ui/index.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { EXPENSE_CATEGORIES } from '../../constants/index.js';
import { money, sum, todayISO } from '../../utils/format.js';

// One person + one project + many category lines → saved as separate expense records.
export default function ExpenseModal({ presetProjectId, onClose }) {
  const { data, addExpenses } = useData();
  const toast = useToast();
  const [projectId, setProjectId] = useState(presetProjectId || data.projects[0]?.id || '');
  const [userId, setUserId] = useState(data.staff[0]?.id || '');
  const [date, setDate] = useState(todayISO());
  const [rows, setRows] = useState([{ category: EXPENSE_CATEGORIES[0].key, amount: '', note: '' }]);

  const setRow = (i, k, v) => setRows((r) => r.map((x, n) => (n === i ? { ...x, [k]: v } : x)));
  const total = sum(rows, (r) => r.amount);

  const submit = (e) => {
    e.preventDefault();
    const valid = rows.filter((r) => Number(r.amount) > 0);
    if (!projectId) return toast('Select a project', 'error');
    if (!valid.length) return toast('Add at least one amount', 'error');
    addExpenses(valid.map((r) => ({ projectId, userId, date, category: r.category, amount: Number(r.amount), note: r.note })));
    toast(`${valid.length} expense${valid.length > 1 ? 's' : ''} added · ${money(sum(valid, (r) => r.amount))}`);
    onClose();
  };

  return (
    <Modal
      title="Add expense"
      size="lg"
      onClose={onClose}
      footer={
        <>
          <span className="muted" style={{ marginRight: 'auto', alignSelf: 'center' }}>Total <b style={{ color: 'var(--text)' }}>{money(total)}</b></span>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" form="expense-form" className="btn btn-primary">Save expenses</button>
        </>
      }
    >
      <form id="expense-form" onSubmit={submit}>
        <div className="form-grid" style={{ marginBottom: 18 }}>
          <Field label="Project">
            <select className="select" value={projectId} onChange={(e) => setProjectId(e.target.value)} disabled={Boolean(presetProjectId)}>
              {data.projects.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.clientName}</option>)}
            </select>
          </Field>
          <Field label="User (who spent / who it is for)">
            <select className="select" value={userId} onChange={(e) => setUserId(e.target.value)}>
              {data.staff.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
            </select>
          </Field>
          <Field label="Date">
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>

        <div className="bold" style={{ marginBottom: 8 }}>Categories</div>
        <div className="exp-row small muted bold" style={{ marginBottom: 4 }}>
          <span>Category</span><span>Amount (₹)</span><span>Note</span><span />
        </div>
        {rows.map((r, i) => (
          <div className="exp-row" key={i}>
            <select className="select" value={r.category} onChange={(e) => setRow(i, 'category', e.target.value)}>
              {EXPENSE_CATEGORIES.map((c) => <option key={c.key}>{c.key}</option>)}
            </select>
            <input className="input" type="number" min="0" placeholder="0" value={r.amount} onChange={(e) => setRow(i, 'amount', e.target.value)} />
            <input className="input" placeholder="Optional note" value={r.note} onChange={(e) => setRow(i, 'note', e.target.value)} />
            <button type="button" className="icon-btn" disabled={rows.length === 1} onClick={() => setRows((x) => x.filter((_, n) => n !== i))} aria-label="Remove line">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-sm" onClick={() => setRows((r) => [...r, { category: EXPENSE_CATEGORIES[1].key, amount: '', note: '' }])}>
          <Plus size={14} /> Add another category
        </button>
      </form>
    </Modal>
  );
}
