import { useState } from 'react';
import { Field, Modal } from '../ui/index.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { PAYMENT_MODES } from '../../constants/index.js';
import { money, todayISO } from '../../utils/format.js';

export default function PaymentModal({ presetProjectId, onClose }) {
  const { data, addPayment, run } = useData();
  const toast = useToast();
  const [f, setF] = useState({
    projectId: presetProjectId || data.projects[0]?.id || '',
    amount: '',
    date: todayISO(),
    mode: PAYMENT_MODES[0],
    note: '',
  });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!Number(f.amount) || Number(f.amount) <= 0) return toast('Enter a valid amount', 'error');
    if (!f.projectId) return toast('Select a project', 'error');
    const ok = await run(() => addPayment({ ...f, amount: Number(f.amount) }), `Payment of ${money(f.amount)} recorded`);
    if (ok) onClose();
  };

  return (
    <Modal
      title="Record payment received"
      size="sm"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" form="payment-form" className="btn btn-primary">Save payment</button>
        </>
      }
    >
      <form id="payment-form" onSubmit={submit} className="stack">
        <Field label="Project">
          <select className="select" value={f.projectId} onChange={set('projectId')} disabled={Boolean(presetProjectId)}>
            {data.projects.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.clientName}</option>)}
          </select>
        </Field>
        <Field label="Amount (₹)">
          <input className="input" type="number" min="0" value={f.amount} onChange={set('amount')} autoFocus />
        </Field>
        <Field label="Date">
          <input className="input" type="date" value={f.date} onChange={set('date')} />
        </Field>
        <Field label="Mode">
          <select className="select" value={f.mode} onChange={set('mode')}>
            {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="Note">
          <input className="input" value={f.note} onChange={set('note')} placeholder="e.g. Milestone 2" />
        </Field>
      </form>
    </Modal>
  );
}
