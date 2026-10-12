// Translates between the REST API shapes (BACKEND_PROMPT.md) and the shapes the UI components use.
// Everything is tolerant of missing optional fields so a slimmer list response never crashes a page.
import { CATEGORY_FROM_API, CATEGORY_TO_API, HUSTLER_ROLE_MAP, MODE_FROM_API, MODE_TO_API } from '../constants/index.js';

const day = (v) => (v ? String(v).slice(0, 10) : v ?? null);
const num = (v) => Number(v) || 0;
const idOf = (x) => (x && typeof x === 'object' ? x.id ?? x.staffId : x);
const titleCase = (s = '') => s.charAt(0) + s.slice(1).toLowerCase();

// ---------- users / master data ----------
export const fromUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: String(u.role || '').toLowerCase(),
  customerId: u.customerId ?? u.customer?.id ?? null,
});

export const fromStaff = (s) => ({
  id: s.id,
  name: s.name,
  role: s.role ?? s.jobTitle ?? '',
  type: titleCase(s.type || 'STAFF'),
  email: s.email,
  phone: s.phone,
});

// `type` follows the role: developer / cloud roles are ENGINEER, everything else STAFF
export const toStaffBody = (f) => ({
  name: f.name,
  role: f.role,
  type: HUSTLER_ROLE_MAP[f.role]?.engineer ? 'ENGINEER' : 'STAFF',
  email: f.email || undefined,
  phone: f.phone || undefined,
});

export const fromCustomer = (c) => ({
  id: c.id,
  name: c.name,
  contactName: c.contactName ?? '',
  email: c.email,
  phone: c.phone ?? '',
});

// ---------- leads ----------
const fromHistory = (h) => ({ stage: h.toStage ?? h.stage, at: day(h.createdAt ?? h.at) });

export const fromLead = (l) => ({
  id: l.id,
  title: l.title,
  company: l.company,
  contactName: l.contactName ?? '',
  phone: l.phone ?? '',
  email: l.email ?? '',
  source: l.source,
  value: num(l.value),
  stage: l.stage,
  owner: l.ownerId ?? l.owner?.id ?? l.owner ?? '',
  expectedClose: day(l.expectedClose),
  notes: l.notes ?? '',
  quote: l.quote ?? null,
  customerId: l.customerId ?? l.customer?.id ?? null,
  projectId: l.projectId ?? l.project?.id ?? null,
  visibleToClient: Boolean(l.visibleToClient),
  showValueToClient: Boolean(l.showValueToClient),
  wonAt: day(l.wonAt),
  createdAt: day(l.createdAt),
  stageUpdatedAt: day(l.stageUpdatedAt),
  stageHistory: (l.stageHistory || l.history || []).map(fromHistory),
});

// UI lead form → request body. `stage` is excluded: stage moves go through PATCH /leads/:id/stage.
export const toLeadBody = (f) => ({
  title: f.title,
  company: f.company,
  contactName: f.contactName,
  phone: f.phone,
  email: f.email,
  source: f.source,
  value: num(f.value),
  ownerId: f.owner || undefined,
  expectedClose: f.expectedClose || undefined,
  notes: f.notes,
  ...(f.quote !== undefined ? { quote: f.quote } : {}),
});

// ---------- projects ----------
const TRACKS = ['requirement', 'ui', 'frontend', 'backend'];
const cap = (k) => k.charAt(0).toUpperCase() + k.slice(1);

const fromDev = (p) =>
  Object.fromEntries(TRACKS.map((k) => [k, num(p.dev?.[k] ?? p.progressTracks?.[k] ?? p[`progress${cap(k)}`])]));

const fromFinance = (f, fallbackContract = 0) =>
  f && {
    contract: num(f.contract ?? f.contractValue ?? fallbackContract),
    received: num(f.received ?? f.paid),
    pending: num(f.pending ?? f.balance),
    spent: num(f.spent ?? f.expenses),
    net: num(f.net),
    projected: num(f.projected),
    margin: num(f.margin),
  };

export const fromProject = (p) => {
  const team = p.team || p.staff || [];
  const members = team.filter((t) => t && typeof t === 'object').map((t) => fromStaff(t.staff ?? t));
  const payments = Array.isArray(p.payments) ? p.payments : p.payments?.items ?? p.payments?.list ?? null;
  const paySummary = !Array.isArray(p.payments) ? p.payments : null;
  return {
    id: p.id,
    leadId: p.leadId ?? null,
    name: p.name,
    clientName: p.clientName ?? p.customer?.name ?? '',
    customerId: p.customerId ?? p.customer?.id ?? null,
    description: p.description ?? '',
    requirements: p.requirements ?? '',
    stage: p.stage,
    startDate: day(p.startDate),
    endDate: day(p.endDate),
    contractValue: num(p.contractValue ?? p.contract),
    plan: p.plan ?? null,
    progress: typeof p.progress === 'number' ? p.progress : null, // server-computed overall %
    dev: fromDev(p),
    team: (p.staffIds || team).map(idOf).filter(Boolean),
    teamMembers: members,
    clientApproved: Boolean(p.clientApproved),
    clientNote: p.clientNote ?? '',
    createdAt: day(p.createdAt),
    closedAt: day(p.closedAt),
    stageHistory: (p.stageHistory || []).map(fromHistory),
    finance: fromFinance(p.finance ?? paySummary, p.contractValue),
    // portal detail embeds the payment list
    embeddedPayments: payments ? payments.map((x) => fromPayment({ ...x, projectId: x.projectId ?? p.id })) : null,
  };
};

// ---------- payments / expenses ----------
export const fromPayment = (p) => ({
  id: p.id,
  projectId: p.projectId ?? p.project?.id,
  amount: num(p.amount),
  date: day(p.paidOn ?? p.date),
  mode: MODE_FROM_API[p.mode] ?? p.mode,
  note: p.note ?? '',
});

export const toPaymentBody = (f) => ({
  projectId: f.projectId,
  amount: num(f.amount),
  paidOn: f.date,
  mode: MODE_TO_API[f.mode] ?? f.mode,
  note: f.note || undefined,
});

export const fromExpense = (e) => ({
  id: e.id,
  projectId: e.projectId ?? e.project?.id ?? null,
  internalProjectId: e.internalProjectId ?? e.internalProject?.id ?? null,
  // PROJECT | INTERNAL_PROJECT | COMPANY | OWNER
  scope: e.scope ?? (e.internalProjectId ? 'INTERNAL_PROJECT' : e.projectId || e.project ? 'PROJECT' : 'COMPANY'),
  userId: e.staffId ?? e.userId ?? e.staff?.id,
  category: CATEGORY_FROM_API[e.category] ?? e.category,
  amount: num(e.amount),
  date: day(e.spentOn ?? e.date),
  note: e.note ?? '',
});

export const toExpenseBatch = ({ scope = 'PROJECT', projectId, internalProjectId, userId, date, lines }) => ({
  scope,
  ...(scope === 'PROJECT' ? { projectId } : scope === 'INTERNAL_PROJECT' ? { internalProjectId } : {}),
  staffId: userId || undefined,
  spentOn: date,
  lines: lines.map((l) => ({ category: CATEGORY_TO_API[l.category] ?? l.category, amount: num(l.amount), note: l.note || undefined })),
});

// ---------- internal projects (our own business; every cost is booked as an expense) ----------
export const fromInternalProject = (p) => ({
  id: p.id,
  name: p.name,
  description: p.description ?? '',
  status: p.status ?? 'ACTIVE',
  budget: num(p.budget),
  startDate: day(p.startDate),
  endDate: day(p.endDate),
  createdAt: day(p.createdAt),
});

export const toInternalProjectBody = (f) => ({
  name: f.name,
  description: f.description || undefined,
  status: f.status,
  budget: num(f.budget),
  startDate: f.startDate || undefined,
  endDate: f.endDate || undefined,
});

// ---------- finance / dashboard aggregates ----------
export const fromFinanceSummary = (s = {}) => ({
  contract: num(s.contractValue ?? s.contract),
  received: num(s.received),
  pending: num(s.pending),
  spent: num(s.expenses ?? s.spent),
  net: num(s.net),
  projected: num(s.projected),
});

export const fromFinanceRow = (r) => ({
  projectId: r.projectId ?? r.id,
  name: r.name ?? r.projectName ?? '',
  clientName: r.clientName ?? r.customer?.name ?? r.customerName ?? '',
  ...fromFinance(r, 0),
});

const monthLabel = (key) => {
  const [y, m] = String(key).split('-').map(Number);
  return new Date(y, (m || 1) - 1, 1).toLocaleString('en-IN', { month: 'short' });
};
export const fromMonthly = (list = []) =>
  list.map((m) => ({ key: m.month, label: monthLabel(m.month), revenue: num(m.revenue), expense: num(m.expense) }));

export const fromByCategory = (list = []) =>
  list.map((c) => ({ label: CATEGORY_FROM_API[c.category] ?? c.category, value: num(c.total ?? c.amount ?? c.value) }));

export const fromByUser = (list = []) =>
  list.map((u) => {
    const raw = u.categories ?? u.byCategory ?? u.split ?? {};
    const cats = Array.isArray(raw)
      ? Object.fromEntries(raw.map((c) => [CATEGORY_FROM_API[c.category] ?? c.category, num(c.total ?? c.amount)]))
      : Object.fromEntries(Object.entries(raw).map(([k, v]) => [CATEGORY_FROM_API[k] ?? k, num(v)]));
    return { id: u.staffId ?? u.userId ?? u.id, name: u.name ?? u.staff?.name, role: u.role ?? u.staff?.role, total: num(u.total), cats };
  });

export const fromDashboard = (d = {}) => ({
  counts: {
    leads: num(d.counts?.leads),
    confirmedLeads: num(d.counts?.confirmedLeads),
    projectsRunning: num(d.counts?.projectsRunning),
    projectsOngoing: num(d.counts?.projectsOngoing),
    projectsClosed: num(d.counts?.projectsClosed),
    awaitingClient: num(d.counts?.awaitingClient),
  },
  money: {
    revenue: num(d.money?.revenue),
    booked: num(d.money?.booked),
    expenses: num(d.money?.expenses),
    net: num(d.money?.net),
  },
  funnel: (d.funnel || []).map((f) => ({ stage: f.stage, count: num(f.count) })),
  runningProjects: (d.runningProjects || []).map(fromProject),
  confirmedDeals: (d.confirmedDeals || []).map(fromLead),
  recentLeads: (d.recentLeads || []).map(fromLead),
  monthly: fromMonthly(d.monthly),
});

export const fromLeadStats = (s = {}) => ({
  total: num(s.total),
  inPipeline: num(s.inPipeline),
  pipelineValue: num(s.pipelineValue),
  won: num(s.won),
  wonValue: num(s.wonValue),
  cancelled: num(s.cancelled),
  winRate: num(s.winRate),
});
