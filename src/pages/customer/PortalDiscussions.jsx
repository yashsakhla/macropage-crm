import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { fmtDate, money } from '../../utils/format.js';
import { clientDiscussions, discussionProgress, lastUpdate } from '../../utils/metrics.js';
import { Badge, EmptyState, ProgressBar } from '../../components/ui/index.jsx';
import { LeadStageBadge } from '../../components/ui/StageBadge.jsx';

function DiscussionCard({ lead }) {
  const closed = lead.stage === 'CANCELLED';
  const pct = discussionProgress(lead);
  return (
    <Link to={`/portal/discussions/${lead.id}`} className={`card project-card ${closed ? 'is-closed' : ''}`}>
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <div className="bold" style={{ fontSize: 15 }}>{lead.title}</div>
        {closed ? <Badge color="#64748b">Closed</Badge> : <LeadStageBadge stage={lead.stage} />}
      </div>
      {!closed && (
        <div className="row" style={{ marginTop: 14 }}>
          <div className="grow"><ProgressBar value={pct} thin /></div>
          <b className="small">{pct}%</b>
        </div>
      )}
      <div className="row between small muted" style={{ marginTop: 10 }}>
        <span>Last update {fmtDate(lastUpdate(lead))}</span>
        {lead.showValueToClient && <span className="bold">{money(lead.value)}</span>}
      </div>
    </Link>
  );
}

export default function PortalDiscussions() {
  const { user } = useAuth();
  const { data } = useData();
  const mine = clientDiscussions(data.leads, user.customerId);
  const active = mine.filter((l) => l.stage !== 'CANCELLED');
  const closed = mine.filter((l) => l.stage === 'CANCELLED');

  return (
    <>
      <div className="page-head">
        <div>
          <h1>My Discussions</h1>
          <p>Proposals and conversations that are not yet confirmed projects.</p>
        </div>
      </div>

      {active.length ? (
        <div className="cards-grid">{active.map((l) => <DiscussionCard key={l.id} lead={l} />)}</div>
      ) : (
        <div className="card">
          <EmptyState title="No active discussions" text="When we start a new conversation with you it will appear here." />
        </div>
      )}

      {closed.length > 0 && (
        <>
          <div className="divider-label">Closed</div>
          <div className="cards-grid">{closed.map((l) => <DiscussionCard key={l.id} lead={l} />)}</div>
        </>
      )}
    </>
  );
}
