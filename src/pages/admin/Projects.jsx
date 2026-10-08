import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, CalendarClock, LayoutGrid, List, Search } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { PROJECT_STAGES } from '../../constants/index.js';
import { fmtDate, money, moneyShort, sum } from '../../utils/format.js';
import { isOngoing, isRunning, projectFinance, projectProgress } from '../../utils/metrics.js';
import { EmptyState, ProgressBar } from '../../components/ui/index.jsx';
import { ProjectStageBadge } from '../../components/ui/StageBadge.jsx';

export default function Projects() {
  const { data } = useData();
  const navigate = useNavigate();
  const [view, setView] = useState('board');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return data.projects.filter((p) => {
      const byFilter = filter === 'all' || (filter === 'running' && isRunning(p)) || (filter === 'closed' && p.stage === 'CLOSED');
      return byFilter && (!t || [p.name, p.clientName].some((v) => v.toLowerCase().includes(t)));
    });
  }, [data.projects, q, filter]);

  const fin = (p) => projectFinance(p, data.payments, data.expenses);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Projects</h1>
          <p>Every confirmed deal lives here. Projects are created automatically when a lead is marked <b>Deal Won</b>.</p>
        </div>
        <Link to="/admin/leads" className="btn btn-primary">Go to lead pipeline</Link>
      </div>

      <div className="stats" style={{ marginBottom: 16 }}>
        <Mini label="Total projects" value={data.projects.length} />
        <Mini label="Running" value={data.projects.filter(isRunning).length} color="#f26522" />
        <Mini label="Ongoing (in execution)" value={data.projects.filter(isOngoing).length} color="#0ea5e9" />
        <Mini label="Closed" value={data.projects.filter((p) => p.stage === 'CLOSED').length} color="#16a34a" />
        <Mini label="Contract value" value={moneyShort(sum(data.projects, (p) => p.contractValue))} />
      </div>

      <div className="toolbar">
        <div className="search">
          <Search size={16} />
          <input className="input" placeholder="Search project or client…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="seg">
          {[['all', 'All'], ['running', 'Running'], ['closed', 'Closed']].map(([k, l]) => (
            <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
        <div className="grow" />
        <div className="seg">
          <button className={view === 'board' ? 'on' : ''} onClick={() => setView('board')}><LayoutGrid size={14} /> Board</button>
          <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}><List size={14} /> List</button>
        </div>
      </div>

      {view === 'board' ? (
        <div className="board">
          {PROJECT_STAGES.map((st) => {
            const items = list.filter((p) => p.stage === st.key);
            return (
              <div key={st.key} className="kcol wide">
                <div className="kcol-head" title={st.hint}>
                  <div className="kcol-title"><i style={{ background: st.color }} />{st.label}<span className="kcol-count">{items.length}</span></div>
                  <div className="kcol-sum">{st.hint}</div>
                </div>
                <div className="kcol-body">
                  {items.map((p) => (
                    <Link key={p.id} to={`/admin/projects/${p.id}`} className="kcard" style={{ cursor: 'pointer' }}>
                      <h4>{p.name}</h4>
                      <div className="co"><Building2 size={13} /> {p.clientName}</div>
                      <div className="val">{money(p.contractValue)}</div>
                      <div style={{ marginTop: 10 }}><ProgressBar value={projectProgress(p)} thin /></div>
                      <div className="meta">
                        <span className="row" style={{ gap: 4 }}><CalendarClock size={12} /> {fmtDate(p.endDate)}</span>
                        <b>{projectProgress(p)}%</b>
                      </div>
                    </Link>
                  ))}
                  {!items.length && <div className="small muted" style={{ textAlign: 'center', padding: 14 }}>—</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Project</th><th>Stage</th><th style={{ minWidth: 150 }}>Progress</th><th>Deadline</th><th>Contract</th><th>Received</th><th>Expenses</th></tr>
              </thead>
              <tbody>
                {list.map((p) => {
                  const f = fin(p);
                  return (
                    <tr key={p.id} className="clickable" onClick={() => navigate(`/admin/projects/${p.id}`)}>
                      <td><div className="bold">{p.name}</div><div className="small muted">{p.clientName}</div></td>
                      <td><ProjectStageBadge stage={p.stage} /></td>
                      <td><div className="row"><div className="grow"><ProgressBar value={projectProgress(p)} thin /></div><b className="small">{projectProgress(p)}%</b></div></td>
                      <td className="nowrap">{fmtDate(p.endDate)}</td>
                      <td className="bold nowrap">{money(f.contract)}</td>
                      <td className="green nowrap">{money(f.received)}</td>
                      <td className="red nowrap">{money(f.spent)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!list.length && <EmptyState title="No projects" text="Mark a lead as Deal Won to create one." />}
        </div>
      )}
    </>
  );
}

function Mini({ label, value, color = '#12233f' }) {
  return (
    <div className="card card-pad">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
    </div>
  );
}
