import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ChevronRight, Eye, ExternalLink, LayoutGrid, List, Phone, Plus, Search } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { LEAD_SOURCES, LEAD_STAGES, PLAN_MAP } from '../../constants/index.js';
import { daysBetween, money, moneyShort, sum, todayISO, fmtDate } from '../../utils/format.js';
import { Avatar, EmptyState } from '../../components/ui/index.jsx';
import { LeadStageBadge } from '../../components/ui/StageBadge.jsx';
import LeadFormModal from '../../components/leads/LeadFormModal.jsx';
import ConvertModal from '../../components/leads/ConvertModal.jsx';
import QuotationModal from '../../components/leads/QuotationModal.jsx';

export default function Leads() {
  const { data, leadStats, moveLead, run } = useData();
  const toast = useToast();
  const [view, setView] = useState('board');
  const [q, setQ] = useState('');
  const [owner, setOwner] = useState('');
  const [source, setSource] = useState('');
  const [form, setForm] = useState(null); // { lead?, stage? }
  const [convert, setConvert] = useState(null);
  const [quote, setQuote] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [over, setOver] = useState(null);

  const staff = (id) => data.staff.find((s) => s.id === id);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return data.leads.filter(
      (l) =>
        (!owner || l.owner === owner) &&
        (!source || l.source === source) &&
        (!t || [l.title, l.company, l.contactName, l.phone, l.email].some((v) => (v || '').toLowerCase().includes(t))),
    );
  }, [data.leads, q, owner, source]);

  // headline numbers come from GET /leads/stats
  const stats = leadStats || { total: 0, inPipeline: 0, pipelineValue: 0, won: 0, wonValue: 0, cancelled: 0, winRate: 0 };

  const requestMove = (id, stage) => {
    const lead = data.leads.find((l) => l.id === id);
    if (!lead || lead.stage === stage) return;
    if (lead.projectId) return toast('This deal is already converted to a project', 'error');
    if (stage === 'WON') return setConvert(lead);
    if (stage === 'PROPOSAL') return setQuote({ lead, stage });
    run(() => moveLead(id, stage), `Moved to “${LEAD_STAGES.find((s) => s.key === stage).label}”`);
  };

  const nextStage = (stage) => {
    const i = LEAD_STAGES.findIndex((s) => s.key === stage);
    // advance along the funnel (never auto-jump into Cancelled)
    return i >= 0 && i < LEAD_STAGES.length - 2 ? LEAD_STAGES[i + 1] : null;
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Lead Generation</h1>
          <p>Track every enquiry from first contact to Deal Won. Drag cards between stages.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setForm({})}>
          <Plus size={16} /> New lead
        </button>
      </div>

      <div className="stats" style={{ marginBottom: 16 }}>
        <MiniStat label="Total leads" value={stats.total} sub="all time" />
        <MiniStat label="In pipeline" value={stats.inPipeline} sub={`${moneyShort(stats.pipelineValue)} potential`} />
        <MiniStat label="Deals won" value={stats.won} sub={`${moneyShort(stats.wonValue)} booked`} color="#16a34a" />
        <MiniStat label="Win rate" value={`${stats.winRate}%`} sub={`${stats.cancelled} cancelled`} color="#f26522" />
      </div>

      <div className="toolbar">
        <div className="search">
          <Search size={16} />
          <input className="input" placeholder="Search lead, company, phone…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="select" value={owner} onChange={(e) => setOwner(e.target.value)}>
          <option value="">All owners</option>
          {data.staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="select" value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">All sources</option>
          {LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <div className="grow" />
        <div className="seg">
          <button className={view === 'board' ? 'on' : ''} onClick={() => setView('board')}><LayoutGrid size={14} /> Board</button>
          <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}><List size={14} /> List</button>
        </div>
      </div>

      {view === 'board' ? (
        <div className="board">
          {LEAD_STAGES.map((st) => {
            const items = filtered.filter((l) => l.stage === st.key);
            return (
              <div
                key={st.key}
                className={`kcol ${over === st.key ? 'over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setOver(st.key); }}
                onDragLeave={() => setOver((o) => (o === st.key ? null : o))}
                onDrop={(e) => {
                  e.preventDefault();
                  setOver(null);
                  requestMove(e.dataTransfer.getData('text/plain') || dragId, st.key);
                  setDragId(null);
                }}
              >
                <div className="kcol-head" title={st.hint}>
                  <div className="kcol-title">
                    <i style={{ background: st.color }} />
                    {st.label}
                    <span className="kcol-count">{items.length}</span>
                  </div>
                  <div className="kcol-sum">{moneyShort(sum(items, (l) => l.value))} · {st.hint}</div>
                </div>
                <div className="kcol-body">
                  {items.map((l) => (
                    <LeadCard
                      key={l.id}
                      lead={l}
                      owner={staff(l.owner)}
                      dragging={dragId === l.id}
                      next={nextStage(l.stage)}
                      onOpen={() => setForm({ lead: l })}
                      onDragStart={(e) => { e.dataTransfer.setData('text/plain', l.id); e.dataTransfer.effectAllowed = 'move'; setDragId(l.id); }}
                      onDragEnd={() => { setDragId(null); setOver(null); }}
                      onNext={() => requestMove(l.id, nextStage(l.stage).key)}
                    />
                  ))}
                  {!items.length && <div className="small muted" style={{ textAlign: 'center', padding: 14 }}>No leads</div>}
                </div>
                {st.key !== 'WON' && st.key !== 'CANCELLED' && (
                  <button className="kcol-add" onClick={() => setForm({ stage: st.key })}>+ Add lead</button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Lead</th><th>Contact</th><th>Source</th><th>Owner</th><th>Value</th><th>Age</th><th>Stage</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} className="clickable" onClick={() => setForm({ lead: l })}>
                    <td>
                      <div className="bold">{l.title}</div>
                      <div className="small muted">{l.company}</div>
                      {l.visibleToClient && <ClientBadge />}
                    </td>
                    <td>
                      <div>{l.contactName || '—'}</div>
                      <div className="small muted">{l.phone}</div>
                    </td>
                    <td><span className="tag">{l.source}</span></td>
                    <td><div className="row"><Avatar name={staff(l.owner)?.name} /> <span className="small">{staff(l.owner)?.name}</span></div></td>
                    <td className="bold nowrap">{money(l.value)}</td>
                    <td className="muted nowrap">{daysBetween(l.createdAt, todayISO())}d</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {l.projectId ? (
                        <Link to={`/admin/projects/${l.projectId}`}><LeadStageBadge stage={l.stage} /></Link>
                      ) : (
                        <select className="select" style={{ minWidth: 190 }} value={l.stage} onChange={(e) => requestMove(l.id, e.target.value)}>
                          {LEAD_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filtered.length && <EmptyState title="No leads found" text="Try clearing the filters or create a new lead." />}
        </div>
      )}

      {form && <LeadFormModal lead={form.lead} presetStage={form.stage} onClose={() => setForm(null)} />}
      {quote && <QuotationModal lead={quote.lead} stage={quote.stage} onClose={() => setQuote(null)} />}
      {convert && <ConvertModal lead={convert} onClose={() => setConvert(null)} />}
    </>
  );
}

function ClientBadge() {
  return (
    <span className="tag row" style={{ gap: 4, marginTop: 6, width: 'fit-content', color: '#0369a1', background: '#e0f2fe' }}>
      <Eye size={11} /> Client can see
    </span>
  );
}

function MiniStat({ label, value, sub, color = '#12233f' }) {
  return (
    <div className="card card-pad">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}

function LeadCard({ lead, owner, next, dragging, onOpen, onDragStart, onDragEnd, onNext }) {
  const age = daysBetween(lead.createdAt, todayISO());
  const converted = Boolean(lead.projectId);
  return (
    <div
      className={`kcard ${dragging ? 'dragging' : ''}`}
      draggable={!converted}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      style={converted ? { cursor: 'pointer' } : undefined}
    >
      <h4>{lead.title}</h4>
      <div className="co"><Building2 size={13} /> {lead.company}</div>
      <div className="val">{money(lead.value)}</div>
      {lead.quote && (
        <div className="small muted" style={{ marginTop: 6 }}>
          Quoted: <b style={{ color: PLAN_MAP.PRO.color }}>Pro {moneyShort(lead.quote.PRO)}</b> · <b style={{ color: PLAN_MAP.PREMIUM.color }}>Premium {moneyShort(lead.quote.PREMIUM)}</b>
        </div>
      )}
      <div className="row wrap" style={{ marginTop: 8, gap: 6 }}>
        <span className="tag">{lead.source}</span>
        {lead.phone && <span className="small muted row" style={{ gap: 4 }}><Phone size={11} />{lead.phone}</span>}
      </div>
      {lead.visibleToClient && <ClientBadge />}
      <div className="meta">
        <div className="row" style={{ gap: 6 }}>
          <Avatar name={owner?.name} />
          <span>{age}d · close {fmtDate(lead.expectedClose).replace(/ \d{4}$/, '')}</span>
        </div>
        <div className="actions" onClick={(e) => e.stopPropagation()}>
          {converted ? (
            <Link to={`/admin/projects/${lead.projectId}`} className="mini-btn go"><ExternalLink size={11} /> Project</Link>
          ) : (
            next && (
              <button className="mini-btn go" onClick={onNext} title={`Move to ${next.label}`}>
                Next <ChevronRight size={12} />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
