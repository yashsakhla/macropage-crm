import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { CATEGORY_COLOR, INTERNAL_STATUS_MAP } from '../../constants/index.js';
import { fmtDate, money, sum } from '../../utils/format.js';
import { groupSum } from '../../utils/metrics.js';
import { Avatar, Badge, EmptyState, HBars, ProgressBar } from '../../components/ui/index.jsx';
import ExpenseModal from '../../components/finance/ExpenseModal.jsx';
import InternalProjectModal from '../../components/projects/InternalProjectModal.jsx';

export default function InternalProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, run, deleteExpense, deleteInternalProject } = useData();
  const [showExpense, setShowExpense] = useState(false);
  const [edit, setEdit] = useState(false);

  const project = data.internalProjects.find((p) => p.id === id);
  if (!project) {
    return <EmptyState title="Internal project not found" action={<Link to="/admin/projects" className="btn">Back to projects</Link>} />;
  }

  const expenses = data.expenses.filter((e) => e.internalProjectId === id).sort((a, b) => b.date.localeCompare(a.date));
  const spent = sum(expenses, (e) => e.amount);
  const st = INTERNAL_STATUS_MAP[project.status];
  const person = (uid) => data.staff.find((s) => s.id === uid);

  const remove = async () => {
    if (!window.confirm(`Delete "${project.name}"? Its expenses will be removed too.`)) return;
    const ok = await run(() => deleteInternalProject(id), 'Internal project deleted');
    if (ok) navigate('/admin/projects');
  };

  return (
    <>
      <div className="page-head">
        <div>
          <Link to="/admin/projects" className="small muted row" style={{ gap: 4 }}><ArrowLeft size={14} /> Projects</Link>
          <h1>{project.name} {st && <Badge color={st.color}>{st.label}</Badge>} <Badge color="#7c3aed">Internal</Badge></h1>
          {project.description && <p>{project.description}</p>}
        </div>
        <div className="row">
          <button className="btn" onClick={() => setEdit(true)}><Pencil size={15} /> Edit</button>
          <button className="btn" onClick={remove}><Trash2 size={15} /> Delete</button>
          <button className="btn btn-primary" onClick={() => setShowExpense(true)}><Plus size={15} /> Add expense</button>
        </div>
      </div>

      <div className="stats" style={{ marginBottom: 16 }}>
        <Stat label="Total cost" value={money(spent)} color="#dc2626" />
        <Stat label="Budget" value={project.budget ? money(project.budget) : '—'} />
        <Stat label="Remaining" value={project.budget ? money(project.budget - spent) : '—'} color={project.budget - spent < 0 ? '#dc2626' : '#16a34a'} />
        <Stat label="Expense entries" value={expenses.length} />
        <Stat label="Timeline" value={`${fmtDate(project.startDate)} → ${fmtDate(project.endDate)}`} small />
      </div>
      {project.budget > 0 && (
        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <div className="small muted" style={{ marginBottom: 6 }}>Budget used · {Math.round((spent / project.budget) * 100)}%</div>
          <ProgressBar value={(spent / project.budget) * 100} color={spent > project.budget ? '#dc2626' : undefined} />
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          {expenses.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Date</th><th>User</th><th>Category</th><th className="right">Amount</th><th /></tr></thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id}>
                      <td className="nowrap">{fmtDate(e.date)}</td>
                      <td><div className="row"><Avatar name={person(e.userId)?.name} /><span>{person(e.userId)?.name}</span></div></td>
                      <td><Badge color={CATEGORY_COLOR[e.category]}>{e.category}</Badge>{e.note && <div className="small muted">{e.note}</div>}</td>
                      <td className="right bold nowrap">{money(e.amount)}</td>
                      <td className="right"><button className="icon-btn" aria-label="Delete expense" onClick={() => window.confirm('Delete this expense?') && run(() => deleteExpense(e.id), 'Expense deleted')}><Trash2 size={15} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState title="No costs yet" text="Add an expense — it is also counted in Finance." />}
        </div>
        <div className="card">
          <div className="card-head"><h3>Cost by category</h3></div>
          <div className="card-body">
            <HBars items={groupSum(expenses, (e) => e.category).map((x) => ({ ...x, color: CATEGORY_COLOR[x.label] }))} format={money} />
          </div>
        </div>
      </div>

      {showExpense && <ExpenseModal presetInternalProjectId={id} onClose={() => setShowExpense(false)} />}
      {edit && <InternalProjectModal project={project} onClose={() => setEdit(false)} />}
    </>
  );
}

function Stat({ label, value, color = '#12233f', small }) {
  return (
    <div className="card card-pad">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color, ...(small ? { fontSize: 14 } : {}) }}>{value}</div>
    </div>
  );
}
