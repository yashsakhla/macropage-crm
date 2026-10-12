import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field, Modal } from '../ui/index.jsx';
import { PROJECT_PLANS } from '../../constants/index.js';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { addDaysISO, money, todayISO } from '../../utils/format.js';

// Deal Won → converts the lead into a project at the "Project Initiate" stage.
export default function ConvertModal({ lead, onClose }) {
  const { data, convertLeadToProject, run } = useData();
  const toast = useToast();
  const navigate = useNavigate();

  const existing = data.customers.find((c) => c.id === lead.customerId)
    || data.customers.find((c) => c.name.toLowerCase() === (lead.company || '').toLowerCase());

  const [f, setF] = useState({
    contractValue: lead.quote?.PRO || lead.value || '',
    startDate: addDaysISO(3),
    endDate: addDaysISO(90),
    customerId: existing?.id || '__new',
    plan: 'PRO',
    description: '',
    requirements: lead.notes || '',
    team: [],
  });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  // picking a plan fills the contract value with the price quoted for it
  const setPlan = (e) => {
    const plan = e.target.value;
    setF((s) => ({ ...s, plan, contractValue: lead.quote?.[plan] || s.contractValue }));
  };
  const toggle = (id) => setF((s) => ({ ...s, team: s.team.includes(id) ? s.team.filter((x) => x !== id) : [...s.team, id] }));

  const submit = async (e) => {
    e.preventDefault();
    if (!Number(f.contractValue)) return toast('Enter the confirmed contract value', 'error');
    if (f.endDate < f.startDate) return toast('Deadline cannot be before start date', 'error');
    const id = await run(() => convertLeadToProject(lead.id, f), '🎉 Deal won — project created at “Project Initiate”');
    if (!id) return;
    onClose();
    navigate(`/admin/projects/${id}`);
  };

  return (
    <Modal
      title="🎉 Deal Won — convert to project"
      size="lg"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" form="convert-form" className="btn btn-green">Confirm & create project</button>
        </>
      }
    >
      <div className="callout info" style={{ marginBottom: 16 }}>
        <div>
          <b>{lead.title}</b> · {lead.company}
          <div className="small muted">Expected value {money(lead.value)}. Confirm the final details — the deal moves into the Projects module.</div>
        </div>
      </div>
      <form id="convert-form" onSubmit={submit} className="form-grid">
        <Field label="Confirmed contract value (₹) *">
          <input className="input" type="number" min="0" value={f.contractValue} onChange={set('contractValue')} autoFocus />
        </Field>
        <Field label="Plan selected by client *">
          <select className="select" value={f.plan} onChange={setPlan}>
            {PROJECT_PLANS.map((p) => <option key={p.key} value={p.key}>{p.label}{lead.quote ? ` — quoted ${money(lead.quote[p.key])}` : ''}</option>)}
          </select>
        </Field>
        <Field label="Client account">
          <select className="select" value={f.customerId} onChange={set('customerId')}>
            {data.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            <option value="__new">+ New client ({lead.company})</option>
          </select>
        </Field>
        <Field label="Start date">
          <input className="input" type="date" value={f.startDate} onChange={set('startDate')} min={todayISO()} />
        </Field>
        <Field label="Deadline">
          <input className="input" type="date" value={f.endDate} onChange={set('endDate')} />
        </Field>
        <Field label="Project overview" full>
          <textarea className="textarea" style={{ minHeight: 64 }} value={f.description} onChange={set('description')} placeholder="What is this project about?" />
        </Field>
        <Field label="Requirements" full>
          <textarea className="textarea" value={f.requirements} onChange={set('requirements')} placeholder="One requirement per line" />
        </Field>
        <Field label="Assign team" full>
          <div className="checks">
            {data.staff.map((s) => (
              <label key={s.id} className="check">
                <input type="checkbox" checked={f.team.includes(s.id)} onChange={() => toggle(s.id)} />
                <span>
                  <b>{s.name}</b>
                  <span className="small muted"> · {s.role}</span>
                </span>
              </label>
            ))}
          </div>
        </Field>
        {f.customerId === '__new' && lead.email && (
          <p className="small muted full">
            A client portal login will be created for <b>{lead.email}</b> and an invite sent with a temporary password.
          </p>
        )}
      </form>
    </Modal>
  );
}
