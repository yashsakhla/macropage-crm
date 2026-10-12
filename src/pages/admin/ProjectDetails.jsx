import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, ChevronRight, ClipboardCheck, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { CATEGORY_COLOR, LEAD_WORK_TYPES, PROJECT_STAGES, PROJECT_WORK_TYPES, WORK_STATUSES, WORK_STATUS_MAP } from '../../constants/index.js';
import { daysBetween, fmtDate, money, todayISO } from '../../utils/format.js';
import { groupSum, projectFinance, projectProgress } from '../../utils/metrics.js';
import { Avatar, Badge, EmptyState, Field, HBars, ProgressBar, Tabs } from '../../components/ui/index.jsx';
import { ProjectStageBadge } from '../../components/ui/StageBadge.jsx';
import { PlanTag } from './Projects.jsx';
import StageStepper from '../../components/projects/StageStepper.jsx';
import DevProgress from '../../components/projects/DevProgress.jsx';
import ExpenseModal from '../../components/finance/ExpenseModal.jsx';
import PaymentModal from '../../components/finance/PaymentModal.jsx';
import { useWorkLog } from '../../hooks/useWorkLog.js';

export default function ProjectDetails() {
  const { id } = useParams();
  const toast = useToast();
  const { data, run, updateProject, setProjectStage, setDev, setTeam, recordClientApproval, deletePayment, deleteExpense } = useData();
  const [tab, setTab] = useState('overview');
  const [edit, setEdit] = useState(null);
  const [showExpense, setShowExpense] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const work = useWorkLog();
  const [wf, setWf] = useState({ staffId: '', scopes: ['project'], types: [], note: '', status: 'IN_PROGRESS' });

  const project = data.projects.find((p) => p.id === id);
  if (!project) {
    return (
      <div className="card">
        <EmptyState title="Project not found" text="It may have been removed." action={<Link className="btn" to="/admin/projects">Back to projects</Link>} />
      </div>
    );
  }

  const fin = projectFinance(project, data.payments, data.expenses);
  const payments = data.payments.filter((p) => p.projectId === id).sort((a, b) => b.date.localeCompare(a.date));
  const expenses = data.expenses.filter((e) => e.projectId === id).sort((a, b) => b.date.localeCompare(a.date));
  const staff = (sid) => data.staff.find((s) => s.id === sid);
  const members = project.team.map(staff).filter(Boolean);
  const engineers = members.filter((m) => m.type === 'Engineer').length;
  const idx = PROJECT_STAGES.findIndex((s) => s.key === project.stage);
  const next = PROJECT_STAGES[idx + 1];
  const closed = project.stage === 'CLOSED';
  const left = daysBetween(todayISO(), project.endDate);
  const progress = projectProgress(project);
  const leadId = project.leadId;
  const workRows = work.entries.filter((w) => (w.scope === 'project' && w.refId === id) || (w.scope === 'lead' && leadId && w.refId === leadId));
  const toggle = (k, v) => setWf((f) => ({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] }));
  const toggleScope = (scope) =>
    setWf((f) => {
      const on = f.scopes.includes(scope);
      return { ...f, scopes: on ? f.scopes.filter((x) => x !== scope) : [...f.scopes, scope], types: on ? f.types.filter((t) => !t.startsWith(`${scope}:`)) : f.types };
    });
  const addWork = (e) => {
    e.preventDefault();
    if (!wf.staffId) return toast('Pick a team member', 'error');
    if (!wf.types.length) return toast('Select at least one work type', 'error');
    wf.types.forEach((k) => {
      const [scope, ...rest] = k.split(':');
      work.add({ scope, refId: scope === 'lead' ? leadId : id, staffId: wf.staffId, type: rest.join(':'), note: wf.note.trim(), status: wf.status });
    });
    toast(`${wf.types.length} work item${wf.types.length > 1 ? 's' : ''} added`);
    setWf((f) => ({ ...f, types: [], note: '' }));
  };

  const changeStage = (key) => {
    if (key === project.stage) return;
    if (key === 'CLOSED' && !project.clientApproved) {
      return toast('Client confirmation is required before closing the project', 'error');
    }
    run(() => setProjectStage(id, key), `Stage → ${PROJECT_STAGES.find((s) => s.key === key).label}`);
  };

  const saveEdit = async () => {
    if (!Number(edit.contractValue)) return toast('Contract value is required', 'error');
    if (edit.endDate < edit.startDate) return toast('Deadline cannot be before start date', 'error');
    const ok = await run(() => updateProject(id, { ...edit, contractValue: Number(edit.contractValue) }), 'Project details saved');
    if (ok) setEdit(null);
  };

  const timeline = closed
    ? `Closed on ${fmtDate(project.closedAt)}`
    : left >= 0
      ? `${left} day${left === 1 ? '' : 's'} left`
      : `${Math.abs(left)} days overdue`;

  return (
    <>
      <Link to="/admin/projects" className="row muted bold" style={{ marginBottom: 12, width: 'fit-content' }}>
        <ArrowLeft size={16} /> All projects
      </Link>

      <div className="card card-pad">
        <div className="row between wrap" style={{ alignItems: 'flex-start' }}>
          <div>
            <div className="row wrap">
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>{project.name}</h1>
              <ProjectStageBadge stage={project.stage} />
              <PlanTag plan={project.plan} />
            </div>
            <div className="muted" style={{ marginTop: 4 }}>{project.clientName} · {fmtDate(project.startDate)} → {fmtDate(project.endDate)}</div>
          </div>
          <div className="row wrap">
            {project.stage === 'CLIENT_CONFIRMATION' && !project.clientApproved && (
              <button className="btn btn-green" onClick={() => run(() => recordClientApproval(id), 'Client approval recorded — project closed 🎉')}>
                <ClipboardCheck size={15} /> Record client approval
              </button>
            )}
            {next && (
              <button
                className="btn btn-primary"
                disabled={next.key === 'CLOSED' && !project.clientApproved}
                title={next.key === 'CLOSED' && !project.clientApproved ? 'Needs client confirmation first' : ''}
                onClick={() => changeStage(next.key)}
              >
                Move to {next.label} <ChevronRight size={15} />
              </button>
            )}
          </div>
        </div>

        <div className="row" style={{ marginTop: 16 }}>
          <div className="grow"><ProgressBar value={progress} /></div>
          <b>{progress}% complete</b>
        </div>
        <div style={{ marginTop: 14 }}>
          <StageStepper stage={project.stage} onSelect={changeStage} />
        </div>
        {project.clientNote && (
          <div className="callout warn" style={{ marginTop: 10 }}>
            <div><b>Client requested changes:</b> {project.clientNote}</div>
          </div>
        )}
      </div>

      <div className="stats mt">
        <Kpi label="Project revenue (contract)" value={money(fin.contract)} />
        <Kpi label="Payment received" value={money(fin.received)} color="#16a34a" sub={`${fin.contract ? Math.round((fin.received / fin.contract) * 100) : 0}% of contract`} />
        <Kpi label="Pending payment" value={money(fin.pending)} color="#d97706" />
        <Kpi label="Project expense" value={money(fin.spent)} color="#dc2626" sub={`${expenses.length} entries`} />
        <Kpi label="Earned so far" value={money(fin.net)} color={fin.net >= 0 ? '#16a34a' : '#dc2626'} sub="received − expenses" />
        <Kpi label="Projected profit" value={money(fin.projected)} color="#12233f" sub={`${fin.margin}% margin`} />
      </div>

      <div className="grid-2e mt">
        <div className="card card-pad row" style={{ gap: 14 }}>
          <div className="stat-icon" style={{ background: '#0ea5e91a', color: '#0ea5e9' }}><CalendarClock size={22} /></div>
          <div>
            <div className="stat-label">Timeline</div>
            <div className="bold" style={{ fontSize: 16 }}>{timeline}</div>
            <div className="small muted">{fmtDate(project.startDate)} → {fmtDate(project.endDate)} · {Math.max(daysBetween(project.startDate, project.endDate), 0)} days planned</div>
          </div>
        </div>
        <div className="card card-pad row" style={{ gap: 14 }}>
          <div className="stat-icon" style={{ background: '#6366f11a', color: '#6366f1' }}><Users size={22} /></div>
          <div>
            <div className="stat-label">Team on this project</div>
            <div className="bold" style={{ fontSize: 16 }}>{members.length} people · {engineers} engineers · {members.length - engineers} staff</div>
            <div className="row" style={{ gap: 4, marginTop: 4 }}>{members.map((m) => <Avatar key={m.id} name={m.name} />)}</div>
          </div>
        </div>
      </div>

      <div className="mt">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { key: 'overview', label: 'Overview' },
            { key: 'progress', label: 'Progress' },
            { key: 'payments', label: `Payments (${payments.length})` },
            { key: 'expenses', label: `Expenses (${expenses.length})` },
            { key: 'team', label: `Team (${members.length})` },
            { key: 'work', label: `Work status (${workRows.length})` },
          ]}
        />

        {tab === 'overview' && (
          <div className="grid-2">
            <div className="card">
              <div className="card-head">
                <h3>Project Initiate details</h3>
                {edit ? (
                  <div className="row"><button className="btn btn-sm" onClick={() => setEdit(null)}>Cancel</button><button className="btn btn-sm btn-primary" onClick={saveEdit}>Save</button></div>
                ) : (
                  <button className="btn btn-sm" onClick={() => setEdit({ description: project.description, requirements: project.requirements, startDate: project.startDate, endDate: project.endDate, contractValue: project.contractValue })}>
                    <Pencil size={13} /> Edit
                  </button>
                )}
              </div>
              <div className="card-body">
                {edit ? (
                  <div className="form-grid">
                    <Field label="Contract value (₹)"><input className="input" type="number" value={edit.contractValue} onChange={(e) => setEdit({ ...edit, contractValue: e.target.value })} /></Field>
                    <span />
                    <Field label="Start date"><input className="input" type="date" value={edit.startDate} onChange={(e) => setEdit({ ...edit, startDate: e.target.value })} /></Field>
                    <Field label="Deadline"><input className="input" type="date" value={edit.endDate} onChange={(e) => setEdit({ ...edit, endDate: e.target.value })} /></Field>
                    <Field label="What is the project about?" full><textarea className="textarea" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
                    <Field label="Requirements" full><textarea className="textarea" style={{ minHeight: 150 }} value={edit.requirements} onChange={(e) => setEdit({ ...edit, requirements: e.target.value })} /></Field>
                  </div>
                ) : (
                  <div className="stack">
                    <div>
                      <div className="small muted bold">ABOUT</div>
                      <p style={{ marginTop: 4 }}>{project.description || <span className="muted">Not added yet.</span>}</p>
                    </div>
                    <div>
                      <div className="small muted bold">REQUIREMENTS</div>
                      <div className="pre" style={{ marginTop: 6 }}>{project.requirements || 'Not added yet.'}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="card">
              <div className="card-head"><h3>Summary</h3></div>
              <div className="card-body">
                <dl className="kv">
                  <dt>Client</dt><dd>{project.clientName}</dd>
                  <dt>Contract value</dt><dd>{money(project.contractValue)}</dd>
                  <dt>Start</dt><dd>{fmtDate(project.startDate)}</dd>
                  <dt>Deadline</dt><dd>{fmtDate(project.endDate)}</dd>
                  <dt>Stage</dt><dd><ProjectStageBadge stage={project.stage} /></dd>
                  <dt>Client approval</dt><dd>{project.clientApproved ? <Badge color="#16a34a">Approved</Badge> : <Badge color="#d97706">Pending</Badge>}</dd>
                  <dt>Source lead</dt><dd><Link to="/admin/leads" className="bold" style={{ color: 'var(--primary)' }}>View in pipeline</Link></dd>
                </dl>
              </div>
            </div>
          </div>
        )}

        {tab === 'progress' && (
          <div className="grid-2">
            <div className="card">
              <div className="card-head"><h3>In Progress — development tracks</h3></div>
              <div className="card-body">
                {project.stage !== 'IN_PROGRESS' && (
                  <div className="callout info" style={{ marginBottom: 12 }}>
                    <div className="small">These tracks drive the overall bar while the project is in the <b>In Progress</b> stage. You can still update them anytime.</div>
                  </div>
                )}
                <DevProgress project={project} onChange={(k, v) => setDev(id, k, v)} />
              </div>
            </div>
            <div className="card">
              <div className="card-head"><h3>Stage control</h3></div>
              <div className="card-body stack">
                <Field label="Current stage">
                  <select className="select" value={project.stage} onChange={(e) => changeStage(e.target.value)}>
                    {PROJECT_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </Field>
                <div className="callout info">
                  <div className="small"><b>Client confirmation gate:</b> after Deployment the client tests and approves from their portal. Only then can the project move to <b>Project Closed</b>.</div>
                </div>
                <dl className="kv">
                  <dt>Overall progress</dt><dd>{progress}%</dd>
                  <dt>Client approval</dt><dd>{project.clientApproved ? 'Approved' : 'Pending'}</dd>
                  <dt>Closed on</dt><dd>{fmtDate(project.closedAt)}</dd>
                </dl>
              </div>
            </div>
          </div>
        )}

        {tab === 'payments' && (
          <div className="card">
            <div className="card-head">
              <h3>Payments received — {money(fin.received)} of {money(fin.contract)}</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setShowPayment(true)}><Plus size={14} /> Record payment</button>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: 14 }}><ProgressBar value={fin.contract ? (fin.received / fin.contract) * 100 : 0} color="#16a34a" /></div>
              {payments.length ? (
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Date</th><th>Mode</th><th>Note</th><th className="right">Amount</th><th /></tr></thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id}>
                          <td>{fmtDate(p.date)}</td><td>{p.mode}</td><td className="muted">{p.note}</td>
                          <td className="right bold green">{money(p.amount)}</td>
                          <td className="right"><button className="icon-btn" aria-label="Delete payment" onClick={() => window.confirm('Delete this payment?') && run(() => deletePayment(p.id), 'Payment deleted')}><Trash2 size={15} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <EmptyState title="No payments yet" text="Record the first payment received from the client." />}
            </div>
          </div>
        )}

        {tab === 'expenses' && (
          <div className="grid-2">
            <div className="card">
              <div className="card-head">
                <h3>Expenses — {money(fin.spent)}</h3>
                <button className="btn btn-primary btn-sm" onClick={() => setShowExpense(true)}><Plus size={14} /> Add expense</button>
              </div>
              <div className="card-body">
                {expenses.length ? (
                  <div className="table-wrap">
                    <table className="table">
                      <thead><tr><th>Date</th><th>User</th><th>Category</th><th className="right">Amount</th><th /></tr></thead>
                      <tbody>
                        {expenses.map((e) => (
                          <tr key={e.id}>
                            <td className="nowrap">{fmtDate(e.date)}</td>
                            <td><div className="row"><Avatar name={staff(e.userId)?.name} /> {staff(e.userId)?.name}</div></td>
                            <td><Badge color={CATEGORY_COLOR[e.category]}>{e.category}</Badge>{e.note && <div className="small muted">{e.note}</div>}</td>
                            <td className="right bold">{money(e.amount)}</td>
                            <td className="right"><button className="icon-btn" aria-label="Delete expense" onClick={() => window.confirm('Delete this expense?') && run(() => deleteExpense(e.id), 'Expense deleted')}><Trash2 size={15} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <EmptyState title="No expenses yet" text="Add salary, cloud, tools or any cost against this project." />}
              </div>
            </div>
            <div className="stack">
              <div className="card">
                <div className="card-head"><h3>By category</h3></div>
                <div className="card-body">
                  {expenses.length ? <HBars items={groupSum(expenses, (e) => e.category).map((x) => ({ ...x, color: CATEGORY_COLOR[x.label] }))} format={money} /> : <span className="muted">—</span>}
                </div>
              </div>
              <div className="card">
                <div className="card-head"><h3>By user</h3></div>
                <div className="card-body">
                  {expenses.length ? <HBars items={groupSum(expenses, (e) => staff(e.userId)?.name || 'Unknown').map((x) => ({ ...x, color: '#12233f' }))} format={money} /> : <span className="muted">—</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'team' && (
          <div className="card">
            <div className="card-head"><h3>{members.length} assigned · {engineers} engineers · {members.length - engineers} staff</h3></div>
            <div className="card-body">
              <div className="checks">
                {data.staff.map((s) => (
                  <label key={s.id} className="check">
                    <input type="checkbox" checked={project.team.includes(s.id)} onChange={() => run(() => setTeam(id, project.team.includes(s.id) ? project.team.filter((x) => x !== s.id) : [...project.team, s.id]))} />
                    <Avatar name={s.name} />
                    <span>
                      <b>{s.name}</b>
                      <div className="small muted">{s.role} · {s.type}</div>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'work' && (
          <div className="card">
            <div className="card-head"><h3>Work status</h3></div>
            <div className="card-body">
              {members.length ? (
                <form onSubmit={addWork} className="form-grid">
                  <Field label="Team member">
                    <select className="select" value={wf.staffId} onChange={(e) => setWf({ ...wf, staffId: e.target.value })}>
                      <option value="">Select…</option>
                      {members.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.role}</option>)}
                    </select>
                  </Field>
                  <Field label="Status">
                    <select className="select" value={wf.status} onChange={(e) => setWf({ ...wf, status: e.target.value })}>
                      {WORK_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Work on (select one or more)" full>
                    <div className="chips">
                      <button type="button" className={`chip ${wf.scopes.includes('project') ? 'on' : ''}`} onClick={() => toggleScope('project')}>Project (tech / delivery)</button>
                      {leadId && <button type="button" className={`chip ${wf.scopes.includes('lead') ? 'on' : ''}`} onClick={() => toggleScope('lead')}>Client / lead (business)</button>}
                    </div>
                  </Field>
                  {[['project', 'Project work types', PROJECT_WORK_TYPES], ['lead', 'Client work types', LEAD_WORK_TYPES]].filter(([sc]) => wf.scopes.includes(sc)).map(([sc, label, list]) => (
                    <Field key={sc} label={`${label} (select one or more)`} full>
                      <div className="chips">
                        {list.map((t) => (
                          <button key={t} type="button" className={`chip ${wf.types.includes(`${sc}:${t}`) ? 'on' : ''}`} onClick={() => toggle('types', `${sc}:${t}`)}>{t}</button>
                        ))}
                      </div>
                    </Field>
                  ))}
                  <Field label="Description" full>
                    <textarea className="textarea" rows={2} value={wf.note} onChange={(e) => setWf({ ...wf, note: e.target.value })} placeholder="What is being done…" />
                  </Field>
                  <div><button type="submit" className="btn btn-primary"><Plus size={15} /> Add work</button></div>
                </form>
              ) : (
                <p className="muted">Assign team members first (Team tab), then describe their work here.</p>
              )}
            </div>
            {workRows.length > 0 && (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Member</th><th>Work</th><th>Description</th><th>Status</th><th>Updated</th><th /></tr></thead>
                  <tbody>
                    {workRows.map((w) => {
                      const m = staff(w.staffId);
                      return (
                        <tr key={w.id}>
                          <td><div className="row"><Avatar name={m?.name || '?'} /><span className="bold">{m?.name || 'Removed'}</span></div></td>
                          <td><div className="bold">{w.type}</div><div className="small muted">{w.scope === 'lead' ? 'Client / lead' : 'Project'}</div></td>
                          <td className="small">{w.note || '—'}</td>
                          <td>
                            <select className="select" value={w.status} onChange={(e) => work.update(w.id, { status: e.target.value })} style={{ color: WORK_STATUS_MAP[w.status]?.color }}>
                              {WORK_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                            </select>
                          </td>
                          <td className="small nowrap">{fmtDate(w.updatedAt.slice(0, 10))}</td>
                          <td className="right"><button className="icon-btn" aria-label="Delete" onClick={() => work.remove(w.id)}><Trash2 size={15} /></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {showExpense && <ExpenseModal presetProjectId={id} onClose={() => setShowExpense(false)} />}
      {showPayment && <PaymentModal presetProjectId={id} onClose={() => setShowPayment(false)} />}
    </>
  );
}

function Kpi({ label, value, sub, color = '#0f1b2d' }) {
  return (
    <div className="card card-pad">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color, fontSize: 20 }}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
