import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, ChevronRight, ClipboardCheck, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { CATEGORY_COLOR, PROJECT_STAGES } from '../../constants/index.js';
import { daysBetween, fmtDate, money, todayISO } from '../../utils/format.js';
import { groupSum, projectFinance, projectProgress } from '../../utils/metrics.js';
import { Avatar, Badge, EmptyState, Field, HBars, ProgressBar, Tabs } from '../../components/ui/index.jsx';
import { ProjectStageBadge } from '../../components/ui/StageBadge.jsx';
import StageStepper from '../../components/projects/StageStepper.jsx';
import DevProgress from '../../components/projects/DevProgress.jsx';
import ExpenseModal from '../../components/finance/ExpenseModal.jsx';
import PaymentModal from '../../components/finance/PaymentModal.jsx';

export default function ProjectDetails() {
  const { id } = useParams();
  const toast = useToast();
  const { data, updateProject, setProjectStage, setDev, toggleTeam, clientApprove, deletePayment, deleteExpense } = useData();
  const [tab, setTab] = useState('overview');
  const [edit, setEdit] = useState(null);
  const [showExpense, setShowExpense] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

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

  const changeStage = (key) => {
    if (key === project.stage) return;
    if (key === 'CLOSED' && !project.clientApproved) {
      return toast('Client confirmation is required before closing the project', 'error');
    }
    setProjectStage(id, key);
    toast(`Stage → ${PROJECT_STAGES.find((s) => s.key === key).label}`);
  };

  const saveEdit = () => {
    if (!Number(edit.contractValue)) return toast('Contract value is required', 'error');
    if (edit.endDate < edit.startDate) return toast('Deadline cannot be before start date', 'error');
    updateProject(id, { ...edit, contractValue: Number(edit.contractValue) });
    setEdit(null);
    toast('Project details saved');
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
            </div>
            <div className="muted" style={{ marginTop: 4 }}>{project.clientName} · {fmtDate(project.startDate)} → {fmtDate(project.endDate)}</div>
          </div>
          <div className="row wrap">
            {project.stage === 'CLIENT_CONFIRMATION' && !project.clientApproved && (
              <button className="btn btn-green" onClick={() => { clientApprove(id); toast('Client approval recorded — project closed 🎉'); }}>
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
                          <td className="right"><button className="icon-btn" aria-label="Delete payment" onClick={() => window.confirm('Delete this payment?') && deletePayment(p.id)}><Trash2 size={15} /></button></td>
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
                            <td className="right"><button className="icon-btn" aria-label="Delete expense" onClick={() => window.confirm('Delete this expense?') && deleteExpense(e.id)}><Trash2 size={15} /></button></td>
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
                    <input type="checkbox" checked={project.team.includes(s.id)} onChange={() => toggleTeam(id, s.id)} />
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
