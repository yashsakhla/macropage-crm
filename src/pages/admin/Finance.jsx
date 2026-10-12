import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, Plus, Receipt, Trash2, TrendingUp, Wallet, Hourglass, FileText } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { api, rows as unwrap } from '../../services/api.js';
import {
  fromByCategory,
  fromByUser,
  fromExpense,
  fromFinanceRow,
  fromFinanceSummary,
  fromMonthly,
} from '../../services/mappers.js';
import { useServer } from '../../hooks/useServer.js';
import { CATEGORY_COLOR, CATEGORY_TO_API, EXPENSE_CATEGORIES } from '../../constants/index.js';
import { fmtDate, money, moneyShort } from '../../utils/format.js';
import { Avatar, Badge, EmptyState, HBars, MonthBars, PageStatus, StatCard, Tabs } from '../../components/ui/index.jsx';
import ExpenseModal from '../../components/finance/ExpenseModal.jsx';
import PaymentModal from '../../components/finance/PaymentModal.jsx';

const EMPTY_SUMMARY = { contract: 0, received: 0, pending: 0, spent: 0, net: 0, projected: 0 };

export default function Finance() {
  const { data, run, deleteExpense, deletePayment } = useData();
  const { projects, payments, staff } = data;
  const [tab, setTab] = useState('overview');
  const [showExpense, setShowExpense] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [fProject, setFProject] = useState('');
  const [fCategory, setFCategory] = useState('');
  const [fUser, setFUser] = useState('');

  const person = (id) => staff.find((s) => s.id === id);
  const project = (id) => projects.find((p) => p.id === id);

  // all aggregates are computed by the backend (/finance/*); filters are applied server-side too
  const overview = useServer('finance-overview', async () => {
    const [summary, rowList, monthly, byCategory] = await Promise.all([
      api.get('/finance/summary'),
      api.get('/finance/projects'),
      api.get('/finance/monthly', { months: 6 }),
      api.get('/finance/expenses/by-category'),
    ]);
    return {
      summary: fromFinanceSummary(summary),
      rows: unwrap(rowList).map(fromFinanceRow),
      monthly: fromMonthly(unwrap(monthly)),
      byCategory: fromByCategory(unwrap(byCategory)),
    };
  });
  const expenseQ = useServer(`finance-expenses:${fProject}:${fCategory}:${fUser}`, async () => {
    const isScope = fProject === 'COMPANY' || fProject === 'OWNER';
    const params = { ...(isScope ? { scope: fProject } : { projectId: fProject }), category: CATEGORY_TO_API[fCategory], staffId: fUser };
    const [list, byUser] = await Promise.all([
      api.list('/expenses', params),
      api.get('/finance/expenses/by-user', isScope ? { scope: fProject } : { projectId: fProject }),
    ]);
    return { list: list.map(fromExpense), byUser: fromByUser(unwrap(byUser)) };
  });

  const ov = overview.value;
  if (!ov) return <PageStatus ready={!overview.loading} error={overview.error} onRetry={() => window.location.reload()} />;
  const { summary: sm, rows: fRows } = ov;
  const contract = sm.contract;
  const received = sm.received;
  const spent = sm.spent;
  const rows = fRows.map((f) => ({ p: { id: f.projectId, name: f.name || project(f.projectId)?.name, clientName: f.clientName || project(f.projectId)?.clientName }, f }));

  const filteredExpenses = [...(expenseQ.value?.list || [])].sort((a, b) => b.date.localeCompare(a.date));
  const filteredTotal = filteredExpenses.reduce((t, e) => t + e.amount, 0);
  const byUser = (expenseQ.value?.byUser || []).filter((u) => !fUser || u.id === fUser);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Finance</h1>
          <p>What each project brings in, what it costs, and what we keep.</p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => setShowPayment(true)}><Banknote size={15} /> Record payment</button>
          <button className="btn btn-primary" onClick={() => setShowExpense(true)}><Plus size={15} /> Add expense</button>
        </div>
      </div>

      <div className="stats">
        <StatCard icon={FileText} label="Contract value booked" value={moneyShort(contract)} sub={`${projects.length} projects`} color="#12233f" />
        <StatCard icon={Wallet} label="Revenue received" value={moneyShort(received)} sub={`${contract ? Math.round((received / contract) * 100) : 0}% collected`} color="#16a34a" />
        <StatCard icon={Hourglass} label="Pending receivable" value={moneyShort(sm.pending)} sub="yet to collect" color="#d97706" />
        <StatCard icon={Receipt} label="Total expenses" value={moneyShort(spent)} sub={`${data.expenses.length} entries`} color="#dc2626" />
        <StatCard icon={TrendingUp} label="Net earned" value={moneyShort(sm.net)} sub={`projected ${moneyShort(sm.projected)}`} color={sm.net >= 0 ? '#16a34a' : '#dc2626'} />
      </div>

      <div className="mt">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { key: 'overview', label: 'Project-wise overview' },
            { key: 'expenses', label: 'Expenses' },
            { key: 'payments', label: `Payments (${payments.length})` },
          ]}
        />

        {tab === 'overview' && (
          <div className="stack" style={{ gap: 16 }}>
            <div className="card">
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>Project</th><th className="right">Revenue</th><th className="right">Received</th><th className="right">Pending</th><th className="right">Expenses</th><th className="right">Earned</th><th className="right">Margin</th></tr>
                  </thead>
                  <tbody>
                    {rows.map(({ p, f }) => (
                      <tr key={p.id}>
                        <td><Link to={`/admin/projects/${p.id}`} className="bold">{p.name}</Link><div className="small muted">{p.clientName}</div></td>
                        <td className="right nowrap">{money(f.contract)}</td>
                        <td className="right nowrap green">{money(f.received)}</td>
                        <td className="right nowrap amber">{money(f.pending)}</td>
                        <td className="right nowrap red">{money(f.spent)}</td>
                        <td className={`right nowrap bold ${f.net >= 0 ? 'green' : 'red'}`}>{money(f.net)}</td>
                        <td className="right"><Badge color={f.margin >= 30 ? '#16a34a' : f.margin >= 10 ? '#d97706' : '#dc2626'}>{f.margin}%</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Total</td>
                      <td className="right">{money(contract)}</td>
                      <td className="right green">{money(received)}</td>
                      <td className="right amber">{money(sm.pending)}</td>
                      <td className="right red">{money(spent)}</td>
                      <td className="right">{money(sm.net)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div className="grid-2e">
              <div className="card">
                <div className="card-head"><h3>Revenue vs expenses · 6 months</h3></div>
                <div className="card-body"><MonthBars series={ov.monthly} format={moneyShort} /></div>
              </div>
              <div className="card">
                <div className="card-head"><h3>Expenses by category</h3></div>
                <div className="card-body">
                  <HBars items={ov.byCategory.map((x) => ({ ...x, color: CATEGORY_COLOR[x.label] }))} format={moneyShort} />
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'expenses' && (
          <div className="stack" style={{ gap: 16 }}>
            <div className="toolbar" style={{ marginBottom: 0 }}>
              <select className="select" value={fProject} onChange={(e) => setFProject(e.target.value)}>
                <option value="">All expenses</option>
                <option value="COMPANY">Company expenses</option>
                <option value="OWNER">Owner expenses</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select className="select" value={fCategory} onChange={(e) => setFCategory(e.target.value)}>
                <option value="">All categories</option>
                {EXPENSE_CATEGORIES.map((c) => <option key={c.key}>{c.key}</option>)}
              </select>
              <select className="select" value={fUser} onChange={(e) => setFUser(e.target.value)}>
                <option value="">All users</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="grow" />
              <div className="bold">{filteredExpenses.length} entries · {money(filteredTotal)}</div>
            </div>

            <div className="grid-2">
              <div className="card">
                {filteredExpenses.length ? (
                  <div className="table-wrap">
                    <table className="table">
                      <thead><tr><th>Date</th><th>Project</th><th>User</th><th>Category</th><th className="right">Amount</th><th /></tr></thead>
                      <tbody>
                        {filteredExpenses.map((e) => (
                          <tr key={e.id}>
                            <td className="nowrap">{fmtDate(e.date)}</td>
                            <td>
                              {e.scope === 'COMPANY' || e.scope === 'OWNER'
                                ? <Badge color={e.scope === 'OWNER' ? '#db2777' : '#0d9488'}>{e.scope === 'OWNER' ? 'Owner expense' : 'Company expense'}</Badge>
                                : e.internalProjectId
                                ? <><Link to={`/admin/internal-projects/${e.internalProjectId}`} className="bold">{data.internalProjects.find((x) => x.id === e.internalProjectId)?.name}</Link> <Badge color="#7c3aed">Internal</Badge></>
                                : <Link to={`/admin/projects/${e.projectId}`} className="bold">{project(e.projectId)?.name}</Link>}
                            </td>
                            <td>{person(e.userId) ? <div className="row"><Avatar name={person(e.userId).name} /><span>{person(e.userId).name}</span></div> : <span className="muted">—</span>}</td>
                            <td><Badge color={CATEGORY_COLOR[e.category]}>{e.category}</Badge>{e.note && <div className="small muted">{e.note}</div>}</td>
                            <td className="right bold nowrap">{money(e.amount)}</td>
                            <td className="right"><button className="icon-btn" aria-label="Delete expense" onClick={() => window.confirm('Delete this expense?') && run(() => deleteExpense(e.id), 'Expense deleted')}><Trash2 size={15} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <EmptyState title="No expenses match" text="Change the filters or add a new expense." />}
              </div>

              <div className="card">
                <div className="card-head"><h3>Per user · by category</h3></div>
                <div className="card-body stack">
                  {byUser.map((u) => (
                    <div key={u.id} style={{ paddingBottom: 12, borderBottom: '1px dashed var(--border)' }}>
                      <div className="row between">
                        <div className="row"><Avatar name={u.name || person(u.id)?.name} /><div><div className="bold">{u.name || person(u.id)?.name}</div><div className="small muted">{u.role || person(u.id)?.role}</div></div></div>
                        <b>{money(u.total)}</b>
                      </div>
                      <div className="row wrap" style={{ marginTop: 8, gap: 6 }}>
                        {Object.entries(u.cats).map(([c, v]) => <Badge key={c} color={CATEGORY_COLOR[c]}>{c} · {moneyShort(v)}</Badge>)}
                      </div>
                    </div>
                  ))}
                  {!byUser.length && <span className="muted">—</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'payments' && (
          <div className="card">
            {payments.length ? (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Date</th><th>Project</th><th>Mode</th><th>Note</th><th className="right">Amount</th><th /></tr></thead>
                  <tbody>
                    {[...payments].sort((a, b) => b.date.localeCompare(a.date)).map((p) => (
                      <tr key={p.id}>
                        <td className="nowrap">{fmtDate(p.date)}</td>
                        <td><Link to={`/admin/projects/${p.projectId}`} className="bold">{project(p.projectId)?.name}</Link><div className="small muted">{project(p.projectId)?.clientName}</div></td>
                        <td>{p.mode}</td>
                        <td className="muted">{p.note}</td>
                        <td className="right bold green nowrap">{money(p.amount)}</td>
                        <td className="right"><button className="icon-btn" aria-label="Delete payment" onClick={() => window.confirm('Delete this payment?') && run(() => deletePayment(p.id), 'Payment deleted')}><Trash2 size={15} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState title="No payments recorded" text="Record the first payment received." />}
          </div>
        )}
      </div>

      {showExpense && <ExpenseModal onClose={() => setShowExpense(false)} />}
      {showPayment && <PaymentModal onClose={() => setShowPayment(false)} />}
    </>
  );
}
