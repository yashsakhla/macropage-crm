import { useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { HUSTLER_ROLES, HUSTLER_ROLE_MAP, WORK_STATUS_MAP } from '../../constants/index.js';
import { useWorkLog } from '../../hooks/useWorkLog.js';
import { Avatar, Badge, EmptyState, Field, Modal } from '../../components/ui/index.jsx';

const EMPTY = { name: '', email: '', phone: '', role: '' };

export default function Hustlers() {
  const { data, run, addStaff, updateStaff, deleteStaff } = useData();
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('');
  const [form, setForm] = useState(null); // { member? }
  const { entries } = useWorkLog();
  const targetName = (w) => (w.scope === 'project' ? data.projects : data.leads).find((x) => x.id === w.refId)?.name;
  const currentWork = (sid) => entries.filter((w) => w.staffId === sid && w.status !== 'DONE');

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return data.staff.filter(
      (s) => (!tag || s.role === tag) && (!t || [s.name, s.email, s.phone].some((v) => (v || '').toLowerCase().includes(t))),
    );
  }, [data.staff, q, tag]);

  const remove = (s) => {
    if (!window.confirm(`Delete ${s.name}? They will no longer be selectable as owner or team member.`)) return;
    run(() => deleteStaff(s.id), 'Hustler deleted');
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Hustlers</h1>
          <p>Your team members and lead owners. Give each person a role — they then appear in <b>Lead owner</b> and <b>Assign team</b>.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setForm({})}><Plus size={16} /> Add hustler</button>
      </div>

      <div className="toolbar">
        <div className="search">
          <Search size={16} />
          <input className="input" placeholder="Search name, email, phone…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="select" value={tag} onChange={(e) => setTag(e.target.value)}>
          <option value="">All roles</option>
          {HUSTLER_ROLES.map((r) => <option key={r.label}>{r.label}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Member</th><th>Roles</th><th>Leads owned</th><th>Projects</th><th>Current work</th><th /></tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="row"><Avatar name={s.name} /><div><div className="bold">{s.name}</div><div className="small muted">{[s.email, s.phone].filter(Boolean).join(' · ') || '—'}</div></div></div>
                  </td>
                  <td>
                    <div className="row wrap" style={{ gap: 6 }}>
                      {s.role ? <Badge color={HUSTLER_ROLE_MAP[s.role]?.color}>{s.role}</Badge> : <span className="muted small">No role</span>}
                    </div>
                  </td>
                  <td className="bold">{data.leads.filter((l) => l.owner === s.id).length}</td>
                  <td className="bold">{data.projects.filter((p) => p.team.includes(s.id)).length}</td>
                  <td>
                    {currentWork(s.id).slice(0, 3).map((w) => (
                      <div key={w.id} className="small" style={{ marginBottom: 4 }}>
                        <Badge color={WORK_STATUS_MAP[w.status]?.color}>{w.type}</Badge>{' '}
                        <span className="muted">{w.scope === 'lead' ? 'Lead' : 'Project'}: {targetName(w) || '—'}</span>
                      </div>
                    ))}
                    {currentWork(s.id).length > 3 && <div className="small muted">+{currentWork(s.id).length - 3} more</div>}
                    {!currentWork(s.id).length && <span className="muted small">—</span>}
                  </td>
                  <td className="right nowrap">
                    <button className="icon-btn" aria-label="Edit" onClick={() => setForm({ member: s })}><Pencil size={15} /></button>
                    <button className="icon-btn" aria-label="Delete" onClick={() => remove(s)}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!list.length && <EmptyState title="No hustlers yet" text="Add your first lead owner or team member." />}
      </div>

      {form && <HustlerModal member={form.member} onClose={() => setForm(null)} onSave={(f) => (form.member ? updateStaff(form.member.id, f) : addStaff(f))} />}
    </>
  );
}

function HustlerModal({ member, onClose, onSave }) {
  const { run } = useData();
  const toast = useToast();
  const [f, setF] = useState(member ? { ...EMPTY, ...member } : EMPTY);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return toast('Name is required', 'error');
    if (!f.role) return toast('Pick a role', 'error');
    const ok = await run(() => onSave({ ...f, name: f.name.trim() }), member ? 'Hustler updated' : 'Hustler added');
    if (ok) onClose();
  };

  return (
    <Modal
      title={member ? 'Edit hustler' : 'Add hustler'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" form="hustler-form" className="btn btn-primary">{member ? 'Save changes' : 'Add hustler'}</button>
        </>
      }
    >
      <form id="hustler-form" onSubmit={submit} className="form-grid">
        <Field label="Full name *"><input className="input" value={f.name} onChange={set('name')} autoFocus /></Field>
        <Field label="Phone"><input className="input" value={f.phone || ''} onChange={set('phone')} /></Field>
        <Field label="Email" full><input className="input" type="email" value={f.email || ''} onChange={set('email')} /></Field>
        <Field label="Role *" full>
          <div className="chips">
            {HUSTLER_ROLES.map((r) => {
              const on = f.role === r.label;
              return (
                <button
                  key={r.label}
                  type="button"
                  className={`chip ${on ? 'on' : ''}`}
                  style={on ? { background: r.color, borderColor: r.color } : undefined}
                  onClick={() => setF((s) => ({ ...s, role: r.label }))}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
          <p className="small muted" style={{ marginTop: 8 }}>
            Every hustler appears in both Lead owner and Assign team.
          </p>
        </Field>
      </form>
    </Modal>
  );
}
