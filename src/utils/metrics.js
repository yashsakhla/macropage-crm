import { DEV_TRACKS } from '../constants/index.js';
import { sum } from './format.js';

// Overall % for stages outside "In Progress"
const STAGE_BASE = {
  INITIATE: 5,
  STARTED: 12,
  TESTING: 65,
  CLOUD_SETUP: 72,
  SERVER_SETUP: 79,
  CONFIRMATION_TESTING: 86,
  DEPLOYMENT: 92,
  CLIENT_CONFIRMATION: 97,
  CLOSED: 100,
};

export const devAverage = (p) => {
  const vals = DEV_TRACKS.map((t) => Number(p.dev?.[t.key]) || 0);
  return Math.round(sum(vals) / vals.length);
};

// In Progress spans 12% → 65% of the overall bar, driven by the four dev tracks
export const projectProgress = (p) =>
  p.stage === 'IN_PROGRESS' ? Math.round(12 + devAverage(p) * 0.53) : STAGE_BASE[p.stage] ?? 0;

export const projectFinance = (p, payments, expenses) => {
  const contract = Number(p.contractValue) || 0;
  const received = sum(payments.filter((x) => x.projectId === p.id), (x) => x.amount);
  const spent = sum(expenses.filter((x) => x.projectId === p.id), (x) => x.amount);
  return {
    contract,
    received,
    pending: Math.max(contract - received, 0),
    spent,
    net: received - spent, // cash actually earned so far
    projected: contract - spent, // profit once fully paid
    margin: contract ? Math.round(((contract - spent) / contract) * 100) : 0,
  };
};

export const isRunning = (p) => p.stage !== 'CLOSED';
export const isOngoing = (p) => !['INITIATE', 'CLOSED'].includes(p.stage);

export const monthlySeries = (payments, expenses, months = 6) => {
  const now = new Date();
  const out = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    out.push({
      key,
      label: d.toLocaleString('en-IN', { month: 'short' }),
      revenue: sum(payments.filter((p) => p.date.startsWith(key)), (p) => p.amount),
      expense: sum(expenses.filter((e) => e.date.startsWith(key)), (e) => e.amount),
    });
  }
  return out;
};

export const groupSum = (items, keyFn, valFn = (x) => x.amount) => {
  const map = new Map();
  items.forEach((it) => map.set(keyFn(it), (map.get(keyFn(it)) || 0) + (Number(valFn(it)) || 0)));
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
};

// Leads an admin has linked to this customer and chosen to show in their portal (not yet converted)
export const clientDiscussions = (leads, customerId) =>
  leads.filter((l) => l.customerId === customerId && l.visibleToClient && !l.projectId && l.stage !== 'WON');

const FUNNEL = ['LEAD', 'IDENTIFIED', 'GENERATED', 'QUALIFIED', 'DEMO', 'PROPOSAL', 'NEGOTIATION', 'VERBAL', 'PENDING'];

// Lead = 0% … Payment / Contract Pending = 100%
export const discussionProgress = (lead) => {
  const i = FUNNEL.indexOf(lead.stage);
  return i < 0 ? 0 : Math.round((i / (FUNNEL.length - 1)) * 100);
};

export const lastUpdate = (lead) =>
  [...(lead.stageHistory || [])].map((h) => h.at).sort().pop() || lead.createdAt;
