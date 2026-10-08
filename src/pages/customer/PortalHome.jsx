import { Link } from 'react-router-dom';
import { CalendarClock, CheckCircle2, FolderKanban, IndianRupee, MessagesSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { fmtDate, money, moneyShort, sum } from '../../utils/format.js';
import { clientDiscussions, projectFinance, projectProgress } from '../../utils/metrics.js';
import { EmptyState, ProgressBar, StatCard } from '../../components/ui/index.jsx';
import { ProjectStageBadge } from '../../components/ui/StageBadge.jsx';

export default function PortalHome() {
  const { user } = useAuth();
  const { data } = useData();
  const mine = data.projects.filter((p) => p.customerId === user.customerId);
  const fins = mine.map((p) => projectFinance(p, data.payments, data.expenses));
  const activeDiscussions = clientDiscussions(data.leads, user.customerId).filter((l) => l.stage !== 'CANCELLED');
  const awaiting = mine.filter((p) => p.stage === 'CLIENT_CONFIRMATION');

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Hello, {user.name.split(' ')[0]} 👋</h1>
          <p>Here is the live status of your projects with MACROPAGE.</p>
        </div>
      </div>

      {activeDiscussions.length > 0 && (
        <div className="callout info" style={{ marginBottom: 16, alignItems: 'center' }}>
          <MessagesSquare size={20} color="#0284c7" />
          <div className="grow small">
            You have <b>{activeDiscussions.length}</b> discussion{activeDiscussions.length > 1 ? 's' : ''} in progress
          </div>
          <Link to="/portal/discussions" className="bold">View →</Link>
        </div>
      )}

      {awaiting.length > 0 && (
        <div className="callout warn" style={{ marginBottom: 16 }}>
          <CheckCircle2 size={20} color="#d97706" />
          <div>
            <b>Your confirmation is needed</b>
            <div className="small">
              {awaiting.map((p) => p.name).join(', ')} {awaiting.length > 1 ? 'are' : 'is'} ready for your final testing and approval.
            </div>
          </div>
        </div>
      )}

      <div className="stats">
        <StatCard icon={FolderKanban} label="My projects" value={mine.length} sub={`${mine.filter((p) => p.stage !== 'CLOSED').length} running`} color="#f26522" />
        <StatCard icon={CheckCircle2} label="Completed" value={mine.filter((p) => p.stage === 'CLOSED').length} color="#16a34a" />
        <StatCard icon={IndianRupee} label="Paid so far" value={moneyShort(sum(fins, (f) => f.received))} sub={`of ${moneyShort(sum(fins, (f) => f.contract))}`} color="#12233f" />
        <StatCard icon={CalendarClock} label="Balance due" value={moneyShort(sum(fins, (f) => f.pending))} color="#d97706" />
      </div>

      <h3 style={{ margin: '24px 0 12px' }}>Your projects</h3>
      {mine.length ? (
        <div className="cards-grid">
          {mine.map((p) => {
            const f = projectFinance(p, data.payments, data.expenses);
            return (
              <Link key={p.id} to={`/portal/projects/${p.id}`} className="card project-card">
                <div className="row between" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <div className="bold" style={{ fontSize: 15 }}>{p.name}</div>
                    <div className="small muted">Due {fmtDate(p.endDate)}</div>
                  </div>
                  <ProjectStageBadge stage={p.stage} />
                </div>
                <div className="row" style={{ marginTop: 14 }}>
                  <div className="grow"><ProgressBar value={projectProgress(p)} /></div>
                  <b>{projectProgress(p)}%</b>
                </div>
                <div className="row between small muted" style={{ marginTop: 10 }}>
                  <span>Paid {money(f.received)}</span>
                  <span>Contract {money(f.contract)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card"><EmptyState title="No projects yet" text="Your projects will appear here once your deal is confirmed." /></div>
      )}
    </>
  );
}
