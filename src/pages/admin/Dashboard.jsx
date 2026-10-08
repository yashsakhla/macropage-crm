import { Link } from 'react-router-dom';
import { Activity, CheckCircle2, FolderKanban, FolderCheck, IndianRupee, PiggyBank, Rocket, Target, Trophy } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { LEAD_STAGES } from '../../constants/index.js';
import { fmtDate, money, moneyShort, sum } from '../../utils/format.js';
import { isOngoing, isRunning, monthlySeries, projectProgress } from '../../utils/metrics.js';
import { HBars, MonthBars, ProgressBar, StatCard } from '../../components/ui/index.jsx';
import { LeadStageBadge, ProjectStageBadge } from '../../components/ui/StageBadge.jsx';

export default function Dashboard() {
  const { data } = useData();
  const { leads, projects, payments, expenses } = data;

  const won = leads.filter((l) => l.stage === 'WON');
  const open = leads.filter((l) => !['WON', 'CANCELLED'].includes(l.stage));
  const running = projects.filter(isRunning);
  const ongoing = projects.filter(isOngoing);
  const closed = projects.filter((p) => p.stage === 'CLOSED');
  const revenue = sum(payments, (p) => p.amount);
  const spent = sum(expenses, (e) => e.amount);
  const booked = sum(projects, (p) => p.contractValue);
  const awaiting = projects.filter((p) => p.stage === 'CLIENT_CONFIRMATION');

  const funnel = LEAD_STAGES.map((s) => ({
    label: s.label,
    value: leads.filter((l) => l.stage === s.key).length,
    color: s.color,
  }));
  const recent = [...leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  const series = monthlySeries(payments, expenses, 6);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Business snapshot — leads, projects and revenue at a glance.</p>
        </div>
      </div>

      <div className="stats">
        <StatCard icon={Target} label="Lead generations" value={leads.length} sub={`${open.length} active in pipeline`} color="#6366f1" />
        <StatCard icon={Trophy} label="Confirmed leads" value={won.length} sub={`${moneyShort(sum(won, (l) => l.value))} deal value`} color="#16a34a" />
        <StatCard icon={FolderKanban} label="Projects running" value={running.length} sub={`${projects.length} total projects`} color="#f26522" />
        <StatCard icon={Rocket} label="Project ongoing" value={ongoing.length} sub="started → client confirmation" color="#0ea5e9" />
        <StatCard icon={FolderCheck} label="Project closed" value={closed.length} sub={`${awaiting.length} awaiting client approval`} color="#14b8a6" />
        <StatCard icon={IndianRupee} label="Revenue generated" value={moneyShort(revenue)} sub={`of ${moneyShort(booked)} booked`} color="#16a34a" />
        <StatCard icon={Activity} label="Total expenses" value={moneyShort(spent)} sub="across all projects" color="#dc2626" />
        <StatCard icon={PiggyBank} label="Net earned" value={moneyShort(revenue - spent)} sub="revenue − expenses" color="#12233f" />
      </div>

      <div className="grid-2 mt">
        <div className="card">
          <div className="card-head"><h3>Lead pipeline</h3><Link to="/admin/leads" className="btn btn-sm">Open pipeline</Link></div>
          <div className="card-body"><HBars items={funnel} /></div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Revenue vs expenses · last 6 months</h3></div>
          <div className="card-body"><MonthBars series={series} format={moneyShort} /></div>
        </div>
      </div>

      <div className="grid-2 mt">
        <div className="card">
          <div className="card-head"><h3>Running projects</h3><Link to="/admin/projects" className="btn btn-sm">All projects</Link></div>
          <div className="card-body stack">
            {running.map((p) => (
              <Link key={p.id} to={`/admin/projects/${p.id}`} className="stack" style={{ gap: 8, paddingBottom: 12, borderBottom: '1px dashed var(--border)' }}>
                <div className="row between">
                  <div>
                    <div className="bold">{p.name}</div>
                    <div className="small muted">{p.clientName} · due {fmtDate(p.endDate)}</div>
                  </div>
                  <ProjectStageBadge stage={p.stage} />
                </div>
                <div className="row">
                  <div className="grow"><ProgressBar value={projectProgress(p)} /></div>
                  <b className="small">{projectProgress(p)}%</b>
                </div>
              </Link>
            ))}
            {!running.length && <div className="muted">No running projects.</div>}
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="card-head"><h3>Confirmed deals</h3></div>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Deal</th><th>Value</th><th>Won on</th></tr></thead>
                <tbody>
                  {won.map((l) => (
                    <tr key={l.id}>
                      <td>
                        {l.projectId ? <Link to={`/admin/projects/${l.projectId}`} className="bold">{l.title}</Link> : <b>{l.title}</b>}
                        <div className="small muted">{l.company}</div>
                      </td>
                      <td className="bold nowrap">{money(l.value)}</td>
                      <td className="muted nowrap">{fmtDate(l.wonAt)}</td>
                    </tr>
                  ))}
                  {!won.length && <tr><td colSpan="3" className="muted">No confirmed deals yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Recent leads</h3></div>
            <div className="card-body stack" style={{ gap: 10 }}>
              {recent.map((l) => (
                <div key={l.id} className="row between">
                  <div>
                    <div className="bold">{l.title}</div>
                    <div className="small muted">{l.company} · {moneyShort(l.value)}</div>
                  </div>
                  <LeadStageBadge stage={l.stage} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
