import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api.js';
import {
  fromCustomer,
  fromExpense,
  fromFinanceRow,
  fromInternalProject,
  fromLead,
  fromLeadStats,
  fromPayment,
  fromProject,
  fromStaff,
  toExpenseBatch,
  toInternalProjectBody,
  toStaffBody,
  toLeadBody,
  toPaymentBody,
} from '../services/mappers.js';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';

const DataContext = createContext(null);

const EMPTY = { leads: [], projects: [], staff: [], customers: [], payments: [], expenses: [], internalProjects: [], discussions: [] };

const loadAdmin = async () => {
  const warnings = [];
  // optional module: if it fails, the rest of the app keeps working and we surface a toast instead
  const optional = (label, call) => call.catch((e) => { warnings.push(`${label}: ${e.message}`); return []; });
  const [leads, projects, staff, customers, payments, expenses, internal, fin, stats] = await Promise.all([
    api.list('/leads'),
    api.list('/projects'),
    api.list('/staff'),
    api.list('/customers'),
    api.list('/payments'),
    api.list('/expenses'),
    optional('Internal projects', api.list('/internal-projects')),
    api.get('/finance/projects'),
    api.get('/leads/stats'),
  ]);
  const finById = Object.fromEntries((Array.isArray(fin) ? fin : fin?.data ?? []).map((r) => [r.projectId ?? r.id, fromFinanceRow(r)]));
  return {
    data: {
      ...EMPTY,
      leads: leads.map(fromLead),
      projects: projects.map(fromProject).map((p) => ({ ...p, finance: p.finance ?? finById[p.id] ?? null })),
      staff: staff.map(fromStaff),
      customers: customers.map(fromCustomer),
      payments: payments.map(fromPayment),
      expenses: expenses.map(fromExpense),
      internalProjects: internal.map(fromInternalProject),
    },
    leadStats: fromLeadStats(stats),
    warnings,
  };
};

// Customers only ever talk to /portal/*; each project is loaded in full (progress, payments, team names).
const loadPortal = async () => {
  const [list, discussions] = await Promise.all([api.list('/portal/projects'), api.list('/portal/discussions')]);
  const projects = (await Promise.all(list.map((p) => api.get(`/portal/projects/${p.id}`).catch(() => p)))).map(fromProject);
  const staff = new Map();
  projects.forEach((p) => p.teamMembers.forEach((m) => staff.set(m.id, m)));
  return {
    data: {
      ...EMPTY,
      projects,
      staff: [...staff.values()],
      payments: projects.flatMap((p) => p.embeddedPayments || []),
      discussions: discussions.map(fromLead),
    },
    leadStats: null,
  };
};

/**
 * Server-backed store. `data` holds what the backend returned (mapped to UI shapes); every action
 * calls the REST endpoint, then refreshes. Nothing is persisted locally and there is no seed data.
 */
export function DataProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(EMPTY);
  const [leadStats, setLeadStats] = useState(null);
  const [status, setStatus] = useState({ ready: false, error: '' });
  const [version, setVersion] = useState(0); // bumps after every refresh so page-level queries re-run
  const role = user?.role;
  const lastWarn = useRef(''); // only toast a given load warning once until it changes

  const refresh = useCallback(async () => {
    if (!role) return;
    try {
      const res = await (role === 'admin' ? loadAdmin() : loadPortal());
      setData(res.data);
      setLeadStats(res.leadStats);
      const warn = res.warnings?.join('; ') || '';
      if (warn && warn !== lastWarn.current) toast(warn, 'error');
      lastWarn.current = warn;
      setStatus({ ready: true, error: '' });
      setVersion((v) => v + 1);
    } catch (e) {
      setStatus((s) => ({ ready: s.ready, error: e.message }));
    }
  }, [role, toast]);

  useEffect(() => {
    setData(EMPTY);
    setLeadStats(null);
    setStatus({ ready: false, error: '' });
    refresh();
  }, [refresh, user?.id]);

  // run an API call, refresh on success, surface failures as a toast. Resolves to the result, or undefined on failure.
  const run = useCallback(
    async (fn, okMsg) => {
      try {
        const res = await fn();
        await refresh();
        if (okMsg) toast(typeof okMsg === 'function' ? okMsg(res) : okMsg);
        return res ?? true;
      } catch (e) {
        toast(e.message, 'error');
        return undefined;
      }
    },
    [refresh, toast],
  );

  // development sliders fire constantly: update the UI immediately, save once the user pauses
  const devTimers = useRef({});
  const devPending = useRef({});

  const actions = useMemo(
    () => ({
      // ----- leads -----
      addLead: async (lead) => {
        const created = await api.post('/leads', toLeadBody(lead));
        if (lead.stage && lead.stage !== 'LEAD') await api.patch(`/leads/${created.id}/stage`, { stage: lead.stage });
        if (lead.customerId || lead.sendWhatsapp) await api.patch(`/leads/${created.id}`, accessBody(lead));
        await refresh();
        return created.id;
      },
      updateLead: async (id, patch) => {
        await api.patch(`/leads/${id}`, toLeadBody(patch));
        await refresh();
      },
      deleteLead: async (id) => {
        await api.del(`/leads/${id}`);
        await refresh();
      },
      moveLead: async (id, stage) => {
        await api.patch(`/leads/${id}/stage`, { stage });
        await refresh();
      },
      setLeadClientAccess: async (id, access) => {
        await api.patch(`/leads/${id}`, accessBody(access));
        await refresh();
      },

      // Deal Won → project (stage = Project Initiate), one transaction on the server
      convertLeadToProject: async (leadId, o) => {
        const project = await api.post(`/leads/${leadId}/convert`, {
          contractValue: Number(o.contractValue),
          startDate: o.startDate,
          endDate: o.endDate,
          customerId: o.customerId === '__new' ? 'NEW' : o.customerId,
          description: o.description || undefined,
          requirements: o.requirements || undefined,
          staffIds: o.team || [],
          plan: o.plan,
        });
        await refresh();
        return project.id;
      },

      // ----- projects (admin) -----
      updateProject: async (id, patch) => {
        await api.patch(`/projects/${id}`, {
          description: patch.description,
          requirements: patch.requirements,
          startDate: patch.startDate,
          endDate: patch.endDate,
          contractValue: Number(patch.contractValue),
        });
        await refresh();
      },
      setProjectStage: async (id, stage) => {
        await api.patch(`/projects/${id}/stage`, { stage });
        await refresh();
      },
      setDev: (id, key, value) => {
        const v = Math.max(0, Math.min(100, Number(value) || 0));
        setData((p) => ({
          ...p,
          projects: p.projects.map((x) => (x.id === id ? { ...x, dev: { ...x.dev, [key]: v } } : x)),
        }));
        const slot = `${id}:${key}`;
        devPending.current[slot] = { id, key, v };
        clearTimeout(devTimers.current[slot]);
        devTimers.current[slot] = setTimeout(async () => {
          const { id: pid, key: k, v: val } = devPending.current[slot];
          delete devPending.current[slot];
          try {
            await api.patch(`/projects/${pid}/progress`, { [k]: val });
            await refresh();
          } catch (e) {
            toast(e.message, 'error');
            refresh();
          }
        }, 500);
      },
      setTeam: async (id, staffIds) => {
        await api.put(`/projects/${id}/team`, { staffIds });
        await refresh();
      },
      recordClientApproval: async (id) => {
        await api.post(`/projects/${id}/record-client-approval`);
        await refresh();
      },

      // ----- projects (customer portal) -----
      clientApprove: async (id) => {
        await api.post(`/portal/projects/${id}/approve`);
        await refresh();
      },
      clientRequestChanges: async (id, note) => {
        await api.post(`/portal/projects/${id}/request-changes`, { note });
        await refresh();
      },

      // ----- hustlers (staff) -----
      addStaff: async (f) => {
        await api.post('/staff', toStaffBody(f));
        await refresh();
      },
      updateStaff: async (id, f) => {
        await api.patch(`/staff/${id}`, toStaffBody(f));
        await refresh();
      },
      deleteStaff: async (id) => {
        await api.del(`/staff/${id}`);
        await refresh();
      },

      // ----- internal projects -----
      addInternalProject: async (f) => {
        const created = await api.post('/internal-projects', toInternalProjectBody(f));
        await refresh();
        return created.id;
      },
      updateInternalProject: async (id, f) => {
        await api.patch(`/internal-projects/${id}`, toInternalProjectBody(f));
        await refresh();
      },
      deleteInternalProject: async (id) => {
        await api.del(`/internal-projects/${id}`);
        await refresh();
      },

      // ----- finance -----
      addPayment: async (pay) => {
        await api.post('/payments', toPaymentBody(pay));
        await refresh();
      },
      deletePayment: async (id) => {
        await api.del(`/payments/${id}`);
        await refresh();
      },
      addExpenses: async (batch) => {
        await api.post('/expenses/batch', toExpenseBatch(batch));
        await refresh();
      },
      deleteExpense: async (id) => {
        await api.del(`/expenses/${id}`);
        await refresh();
      },
    }),
    [refresh, toast],
  );

  const value = useMemo(
    () => ({ data, leadStats, ...status, version, refresh, run, ...actions }),
    [data, leadStats, status, version, refresh, run, actions],
  );
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// customerId '__new' means "create a client account from newClient {name, phone}"; the backend returns the new customer id
// and sends the WhatsApp message (sendWhatsapp) asynchronously.
const accessBody = ({ customerId, visibleToClient, showValueToClient, sendWhatsapp, newClient }) => {
  const isNew = customerId === '__new';
  return {
    customerId: isNew ? null : customerId || null,
    ...(isNew ? { newClient } : {}),
    visibleToClient: Boolean(customerId && visibleToClient),
    showValueToClient: Boolean(customerId && visibleToClient && showValueToClient),
    sendWhatsapp: Boolean(sendWhatsapp),
  };
};

export const useData = () => useContext(DataContext);
