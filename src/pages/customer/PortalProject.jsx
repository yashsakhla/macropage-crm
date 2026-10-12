import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, MessageSquareWarning } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { daysBetween, fmtDate, money, todayISO } from '../../utils/format.js';
import { projectFinance, projectProgress } from '../../utils/metrics.js';
import { Avatar, EmptyState, Field, Modal, ProgressBar } from '../../components/ui/index.jsx';
import { ProjectStageBadge } from '../../components/ui/StageBadge.jsx';
import StageStepper from '../../components/projects/StageStepper.jsx';
import DevProgress from '../../components/projects/DevProgress.jsx';

export default function PortalProject() {
  const { id } = useParams();
  const toast = useToast();
  const { data, run, clientApprove, clientRequestChanges } = useData();
  const [changes, setChanges] = useState(null); // string while the dialog is open

  // customers can only open their own projects
  const project = data.projects.find((p) => p.id === id);
  if (!project) {
    return (
      <div className="card">
        <EmptyState title="Project not found" text="This project is not linked to your account." action={<Link className="btn" to="/portal">Back</Link>} />
      </div>
    );
  }

  const fin = projectFinance(project, data.payments, data.expenses);
  const payments = data.payments.filter((p) => p.projectId === id).sort((a, b) => b.date.localeCompare(a.date));
  const team = project.teamMembers;
  const progress = projectProgress(project);
  const left = daysBetween(todayISO(), project.endDate);
  const needsApproval = project.stage === 'CLIENT_CONFIRMATION';

  return (
    <>
      <Link to="/portal" className="row muted bold" style={{ marginBottom: 12, width: 'fit-content' }}>
        <ArrowLeft size={16} /> My projects
      </Link>

      <div className="card card-pad">
        <div className="row between wrap">
          <div>
            <div className="row wrap">
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>{project.name}</h1>
              <ProjectStageBadge stage={project.stage} />
            </div>
            <div className="muted" style={{ marginTop: 4 }}>
              {fmtDate(project.startDate)} → {fmtDate(project.endDate)} ·{' '}
              {project.stage === 'CLOSED' ? `Closed ${fmtDate(project.closedAt)}` : left >= 0 ? `${left} days left` : `${Math.abs(left)} days past deadline`}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="stat-value">{progress}%</div>
            <div className="small muted">overall progress</div>
          </div>
        </div>
        <div style={{ marginTop: 14 }}><ProgressBar value={progress} /></div>
        <div style={{ marginTop: 16 }}><StageStepper stage={project.stage} /></div>
      </div>

      {needsApproval && (
        <div className="callout warn" style={{ marginTop: 16, alignItems: 'center' }}>
          <CheckCircle2 size={22} color="#d97706" />
          <div className="grow">
            <b>Final client confirmation</b>
            <div className="small">Please test the delivered project. If everything works as agreed, approve it to close the project.</div>
          </div>
          <div className="row wrap">
            <button className="btn" onClick={() => setChanges('')}><MessageSquareWarning size={15} /> Request changes</button>
            <button className="btn btn-green" onClick={() => run(() => clientApprove(id), 'Thank you! Project approved and closed 🎉')}>Approve & close project</button>
          </div>
        </div>
      )}
      {project.stage === 'CLOSED' && (
        <div className="callout ok" style={{ marginTop: 16 }}>
          <CheckCircle2 size={20} color="#16a34a" />
          <div><b>Project delivered and closed.</b> <span className="small">Thank you for working with MACROPAGE.</span></div>
        </div>
      )}
      {project.clientNote && !needsApproval && project.stage !== 'CLOSED' && (
        <div className="callout info" style={{ marginTop: 16 }}>
          <div><b>Your requested changes:</b> {project.clientNote}</div>
        </div>
      )}

      <div className="grid-2 mt">
        <div className="stack">
          <div className="card">
            <div className="card-head"><h3>Development progress</h3></div>
            <div className="card-body"><DevProgress project={project} /></div>
          </div>
          <div className="card">
            <div className="card-head"><h3>About this project</h3></div>
            <div className="card-body stack">
              <p>{project.description || <span className="muted">Details will be shared soon.</span>}</p>
              {project.requirements && <div className="pre">{project.requirements}</div>}
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="card-head"><h3>Payments</h3></div>
            <div className="card-body">
              <dl className="kv" style={{ marginBottom: 12 }}>
                <dt>Contract value</dt><dd>{money(fin.contract)}</dd>
                <dt>Paid</dt><dd className="green bold">{money(fin.received)}</dd>
                <dt>Balance</dt><dd className="amber bold">{money(fin.pending)}</dd>
              </dl>
              <ProgressBar value={fin.contract ? (fin.received / fin.contract) * 100 : 0} color="#16a34a" />
              <table className="table" style={{ marginTop: 12 }}>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td>{fmtDate(p.date)}<div className="small muted">{p.mode}{p.note ? ` · ${p.note}` : ''}</div></td>
                      <td className="right bold">{money(p.amount)}</td>
                    </tr>
                  ))}
                  {!payments.length && <tr><td className="muted">No payments yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><h3>Your MACROPAGE team</h3></div>
            <div className="card-body stack" style={{ gap: 10 }}>
              {team.map((m) => (
                <div className="row" key={m.id}>
                  <Avatar name={m.name} large />
                  <div><div className="bold">{m.name}</div><div className="small muted">{m.role}</div></div>
                </div>
              ))}
              {!team.length && <span className="muted">Team will be assigned at kick-off.</span>}
            </div>
          </div>
        </div>
      </div>

      {changes !== null && (
        <Modal
          title="Request changes"
          size="sm"
          onClose={() => setChanges(null)}
          footer={
            <>
              <button className="btn" onClick={() => setChanges(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  if (!changes.trim()) return toast('Please describe what needs to change', 'error');
                  const ok = await run(() => clientRequestChanges(id, changes.trim()), 'Sent to the MACROPAGE team');
                  if (ok) setChanges(null);
                }}
              >
                Send to team
              </button>
            </>
          }
        >
          <Field label="What needs to be fixed or changed?">
            <textarea className="textarea" value={changes} onChange={(e) => setChanges(e.target.value)} autoFocus />
          </Field>
        </Modal>
      )}
    </>
  );
}
