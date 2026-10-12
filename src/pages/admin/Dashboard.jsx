import { Link } from 'react-router-dom';
import { Activity, CheckCircle2, FolderKanban, FolderCheck, IndianRupee, PiggyBank, Rocket, Target, Trophy } from 'lucide-react';
import { api } from '../../services/api.js';
import { fromDashboard } from '../../services/mappers.js';
import { useServer } from '../../hooks/useServer.js';
import { LEAD_STAGES } from '../../constants/index.js';
import { fmtDate, money, moneyShort } from '../../utils/format.js';
import { projectProgress } from '../../utils/metrics.js';
import { HBars, MonthBars, PageStatus, ProgressBar, StatCard } from '../../components/ui/index.jsx';
import { LeadStageBadge, ProjectStageBadge } from '../../components/ui/StageBadge.jsx';

export default function Dashboard() {
  const { value: d, error, loading } = useServer('dashboard', async () => fromDashboard(await api.get('/dashboard')));
  if (!d) return <PageStatus ready={!loading} error={error} onRetry={() => window.location.reload()} />;

  const { counts, money: m, runningProjects: running, confirmedDeals: won, recentLeads: recent, monthly: series } = d;
  const open = counts.leads - counts.confirmedLeads - (d.funnel.find((f) => f.stage === 'CANCELLED')?.count || 0);
  const funnel = LEAD_STAGES.map((s) => ({
    label: s.label,
    value: d.funnel.find((f) => f.stage === s.key)?.count || 0,
    color: s.color,
  }));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Business snapshot — leads, projects and revenue at a glance.</p>
        </div>
      </div>

      <div className="stats">
        <StatCard icon={Target} label="Lead generations" value={counts.leads} sub={`${open} active in pipeline`} color="#6366f1" />
        <StatCard icon={Trophy} label="Confirmed leads" value={counts.confirmedLeads} sub={`${moneyShort(won.reduce((t, l) => t + l.value, 0))} deal value`} color="#16a34a" />
        <StatCard icon={FolderKanban} label="Projects running" value={counts.projectsRunning} sub={`${counts.projectsRunning + counts.projectsClosed} total projects`} color="#f26522" />
        <StatCard icon={Rocket} label="Project ongoing" value={counts.projectsOngoing} sub="started → client confirmation" color="#0ea5e9" />
        <StatCard icon={FolderCheck} label="Project closed" value={counts.projectsClosed} sub={`${counts.awaitingClient} awaiting client approval`} color="#14b8a6" />
        <StatCard icon={IndianRupee} label="Revenue generated" value={moneyShort(m.revenue)} sub={`of ${moneyShort(m.booked)} booked`} color="#16a34a" />
        <StatCard icon={Activity} label="Total expenses" value={moneyShort(m.expenses)} sub="across all projects" color="#dc2626" />
        <StatCard icon={PiggyBank} label="Net earned" value={moneyShort(m.net)} sub="revenue − expenses" color="#12233f" />
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
