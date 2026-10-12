import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Field, Modal } from '../ui/index.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { LEAD_SOURCES, LEAD_STAGES } from '../../constants/index.js';
import { addDaysISO } from '../../utils/format.js';

const EMPTY = {
  title: '',
  company: '',
  contactName: '',
  phone: '',
  email: '',
  source: 'Website',
  value: '',
  owner: '',
  stage: 'LEAD',
  expectedClose: addDaysISO(30),
  notes: '',
  customerId: '',
  visibleToClient: false,
  showValueToClient: false,
  sendWhatsapp: false,
};

const NEW_CLIENT = '__new';

export default function LeadFormModal({ lead, presetStage, onClose }) {
  const { data, addLead, updateLead, moveLead, setLeadClientAccess, deleteLead, run } = useData();
  const toast = useToast();
  const editing = Boolean(lead);
  const locked = Boolean(lead?.projectId); // converted leads keep their stage
  const [f, setF] = useState(lead ? { ...EMPTY, ...lead } : { ...EMPTY, owner: data.staff[0]?.id || '', stage: presetStage || 'LEAD' });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const setClient = (e) =>
    setF((s) => ({ ...s, customerId: e.target.value, ...(e.target.value ? {} : { visibleToClient: false, showValueToClient: false }) }));
  const setVisible = (e) =>
    setF((s) => ({ ...s, visibleToClient: e.target.checked, ...(e.target.checked ? {} : { showValueToClient: false }) }));

  const hasClient = Boolean(f.customerId);

  const submit = async (e) => {
    e.preventDefault();
    if (!f.title.trim() || !f.company.trim()) return toast('Requirement and company are required', 'error');
    const isNew = f.customerId === NEW_CLIENT;
    if (isNew && (!f.contactName.trim() || !f.phone.trim())) return toast('Contact name and phone are needed to create a client account', 'error');
    const { stageHistory, customerId, visibleToClient, showValueToClient, sendWhatsapp, ...rest } = f;
    const payload = { ...rest, value: Number(f.value) || 0 };
    const access = {
      customerId,
      visibleToClient,
      showValueToClient,
      sendWhatsapp,
      ...(isNew ? { newClient: { name: f.contactName.trim(), phone: f.phone.trim(), email: f.email.trim() || undefined } } : {}),
    };
    const ok = editing
      ? await run(async () => {
          await updateLead(lead.id, payload);
          if (!locked) {
            if (f.stage !== lead.stage) await moveLead(lead.id, f.stage);
            await setLeadClientAccess(lead.id, access);
          }
        }, 'Lead updated')
      : await run(() => addLead({ ...payload, ...access }), 'Lead created');
    if (ok) onClose();
  };

  const remove = async () => {
    if (!window.confirm('Delete this lead permanently?')) return;
    const ok = await run(() => deleteLead(lead.id), 'Lead deleted');
    if (ok) onClose();
  };

  return (
    <Modal
      title={editing ? 'Edit lead' : 'Create lead'}
      onClose={onClose}
      size="lg"
      footer={
        <>
          {editing && !locked && (
            <button type="button" className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={remove}>
              <Trash2 size={14} /> Delete
            </button>
          )}
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" form="lead-form" className="btn btn-primary">{editing ? 'Save changes' : 'Create lead'}</button>
        </>
      }
    >
      <form id="lead-form" onSubmit={submit} className="form-grid">
        <Field label="Requirement / project title *" full>
          <input className="input" value={f.title} onChange={set('title')} placeholder="e.g. Hotel booking mobile app" autoFocus />
        </Field>
        <Field label="Company / client *">
          <input className="input" value={f.company} onChange={set('company')} />
        </Field>
        <Field label="Contact person">
          <input className="input" value={f.contactName} onChange={set('contactName')} />
        </Field>
        <Field label="Phone">
          <input className="input" value={f.phone} onChange={set('phone')} />
        </Field>
        <Field label="Email">
          <input className="input" type="email" value={f.email} onChange={set('email')} />
        </Field>
        <Field label="Expected deal value (₹)">
          <input className="input" type="number" min="0" value={f.value} onChange={set('value')} />
        </Field>
        <Field label="Source">
          <select className="select" value={f.source} onChange={set('source')}>
            {LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Lead owner">
          <select className="select" value={f.owner} onChange={set('owner')}>
            {data.staff.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
          </select>
        </Field>
        <Field label="Stage">
          <select className="select" value={f.stage} onChange={set('stage')} disabled={locked}>
            {LEAD_STAGES.filter((s) => s.key !== 'WON' || locked).map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Expected close date">
          <input className="input" type="date" value={f.expectedClose || ''} onChange={set('expectedClose')} />
        </Field>
        <Field label="Notes / requirements" full>
          <textarea className="textarea" value={f.notes} onChange={set('notes')} placeholder="Key requirements, discussion points…" />
        </Field>
        {!locked && (
          <div className="full stack" style={{ gap: 10, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
            <div className="bold">Client portal access</div>
            <Field label="Client account">
              <select className="select" value={f.customerId || ''} onChange={setClient}>
                <option value="">— None —</option>
                <option value={NEW_CLIENT}>＋ New client (use contact name &amp; phone above)</option>
                {data.customers.map((c) => <option key={c.id} value={c.id}>{c.contactName || c.name} · {c.phone}</option>)}
              </select>
            </Field>
            {f.customerId === NEW_CLIENT && (
              <p className="small muted">
                A client account will be created for <b>{f.contactName || 'the contact person'}</b> ({f.phone || 'phone required'}).
                The client signs in to the portal with this phone number.
              </p>
            )}
            <label className="check" style={hasClient ? undefined : { opacity: 0.55 }}>
              <input type="checkbox" checked={f.visibleToClient} disabled={!hasClient} onChange={setVisible} />
              <span>Visible to client in their portal</span>
            </label>
            <label className="check" style={f.visibleToClient ? undefined : { opacity: 0.55 }}>
              <input
                type="checkbox"
                checked={f.showValueToClient}
                disabled={!f.visibleToClient}
                onChange={(e) => setF((s) => ({ ...s, showValueToClient: e.target.checked }))}
              />
              <span>Show deal value to client</span>
            </label>
            <label className="check">
              <input type="checkbox" checked={f.sendWhatsapp} onChange={(e) => setF((s) => ({ ...s, sendWhatsapp: e.target.checked }))} />
              <span>Send WhatsApp message to client</span>
            </label>
            <p className="small muted">Client sees only the stage and timeline. Notes, source and owner stay private.</p>
          </div>
        )}
        {!locked && (
          <p className="small muted full">To mark a deal as won, drag the card into “Deal Won 🎉” — it will be converted into a project.</p>
        )}
      </form>
    </Modal>
  );
}
