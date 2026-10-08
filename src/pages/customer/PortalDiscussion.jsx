import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { LEAD_STAGES, LEAD_STAGE_MAP } from '../../constants/index.js';
import { fmtDate, money } from '../../utils/format.js';
import { clientDiscussions, discussionProgress } from '../../utils/metrics.js';
import { Badge, EmptyState, ProgressBar } from '../../components/ui/index.jsx';
import { LeadStageBadge } from '../../components/ui/StageBadge.jsx';
import StageStepper from '../../components/projects/StageStepper.jsx';

const STEPPER_STAGES = LEAD_STAGES.filter((s) => s.key !== 'CANCELLED');

// Friendly "what happens next", keyed by the stage that comes next
const NEXT_TEXT = {
  IDENTIFIED: 'We will identify the right people and details for your requirement.',
  GENERATED: 'We will capture your contact and requirement details.',
  QUALIFIED: 'We will review your requirement to confirm we are the right fit.',
  DEMO: 'We will arrange a demo or presentation for you.',
  PROPOSAL: 'We will prepare and share a proposal and quotation.',
  NEGOTIATION: 'We will go through the proposal together and discuss pricing, terms and features.',
  VERBAL: 'Once we agree on the details, we will ask for your confirmation to proceed.',
  PENDING: 'We will share the agreement and payment details to formalise things.',
  WON: 'Once the payment or contract is completed, your project will begin and appear under My Projects.',
};

export default function PortalDiscussion() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data } = useData();

  // customers only see discussions admin linked to them and marked visible
  const lead = clientDiscussions(data.leads, user.customerId).find((l) => l.id === id);
  if (!lead) {
    return (
      <div className="card">
        <EmptyState title="Discussion not found" text="This discussion is not linked to your account." action={<Link className="btn" to="/portal/discussions">Back</Link>} />
      </div>
    );
  }

  const closed = lead.stage === 'CANCELLED';
  const stage = LEAD_STAGE_MAP[lead.stage];
  const idx = STEPPER_STAGES.findIndex((s) => s.key === lead.stage);
  const next = STEPPER_STAGES[idx + 1];
  const history = [...(lead.stageHistory || [])].reverse().sort((a, b) => b.at.localeCompare(a.at));
  const pct = discussionProgress(lead);

  return (
    <>
      <Link to="/portal/discussions" className="row muted bold" style={{ marginBottom: 12, width: 'fit-content' }}>
        <ArrowLeft size={16} /> My discussions
      </Link>

      <div className="card card-pad">
        <div className="row between wrap">
          <div className="row wrap">
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>{lead.title}</h1>
            {closed ? <Badge color="#64748b">Closed</Badge> : <LeadStageBadge stage={lead.stage} />}
          </div>
          {!closed && (
            <div style={{ textAlign: 'right' }}>
              <div className="stat-value">{pct}%</div>
              <div className="small muted">towards a confirmed project</div>
            </div>
          )}
        </div>
        {!closed && (
          <>
            <div style={{ marginTop: 14 }}><ProgressBar value={pct} /></div>
            <div style={{ marginTop: 16 }}><StageStepper stage={lead.stage} stages={STEPPER_STAGES} /></div>
          </>
        )}
      </div>

      <div className="grid-2 mt">
        <div className="card">
          <div className="card-head"><h3>Where we are</h3></div>
          <div className="card-body stack">
            {closed ? (
              <p>This discussion has been closed. If you would like to pick it up again, please get in touch with the MACROPAGE team.</p>
            ) : (
              <>
                <div>
                  <div className="bold">{stage?.label}</div>
                  <div className="muted">{stage?.hint}</div>
                </div>
                <div className="callout info">
                  <div>
                    <b>What happens next</b>
                    <div className="small">{NEXT_TEXT[next?.key]}</div>
                  </div>
                </div>
              </>
            )}
            {lead.showValueToClient && (
              <dl className="kv"><dt>Proposed value</dt><dd className="bold">{money(lead.value)}</dd></dl>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Discussion timeline</h3></div>
          <div className="card-body stack" style={{ gap: 10 }}>
            {history.map((h, i) => (
              <div className="row between" key={`${h.stage}-${h.at}-${i}`}>
                <span className={i === 0 ? 'bold' : ''}>{h.stage === 'CANCELLED' ? 'Closed' : LEAD_STAGE_MAP[h.stage]?.label || h.stage}</span>
                <span className="small muted">{fmtDate(h.at)}</span>
              </div>
            ))}
            {!history.length && <span className="muted">No updates yet.</span>}
          </div>
        </div>
      </div>
    </>
  );
}
