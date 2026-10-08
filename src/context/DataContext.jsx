import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { buildSeed } from '../data/seed.js';
import { todayISO, uid } from '../utils/format.js';

const KEY = 'macropage-crm-data-v2';
const DataContext = createContext(null);

const load = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return buildSeed();
};

/**
 * Local, localStorage-backed store so the UI works with zero setup.
 * Every action here maps 1:1 to a REST endpoint in BACKEND_PROMPT.md —
 * swap the setData(...) bodies for api.post / api.patch calls when the NestJS API is live.
 */
export function DataProvider({ children }) {
  const [data, setData] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* storage full / blocked */
    }
  }, [data]);

  const patchList = (list, id, patch) => list.map((x) => (x.id === id ? { ...x, ...patch } : x));

  const actions = useMemo(
    () => ({
      // ----- leads -----
      addLead: (lead) => {
        const id = uid('l');
        setData((p) => ({
          ...p,
          leads: [
            {
              projectId: null,
              customerId: null,
              visibleToClient: false,
              showValueToClient: false,
              createdAt: todayISO(),
              ...lead,
              id,
              stageHistory: [{ stage: lead.stage || 'LEAD', at: todayISO() }],
            },
            ...p.leads,
          ],
        }));
        return id;
      },
      updateLead: (id, patch) => setData((p) => ({ ...p, leads: patchList(p.leads, id, patch) })),
      deleteLead: (id) => setData((p) => ({ ...p, leads: p.leads.filter((l) => l.id !== id) })),
      moveLead: (id, stage) =>
        setData((p) => ({
          ...p,
          leads: p.leads.map((l) =>
            l.id === id
              ? { ...l, stage, stageUpdatedAt: todayISO(), stageHistory: [...(l.stageHistory || []), { stage, at: todayISO() }] }
              : l,
          ),
        })),
      setLeadClientAccess: (id, { customerId, visibleToClient, showValueToClient }) =>
        setData((p) => ({
          ...p,
          leads: patchList(p.leads, id, {
            customerId: customerId || null,
            visibleToClient: Boolean(customerId && visibleToClient),
            showValueToClient: Boolean(customerId && visibleToClient && showValueToClient),
          }),
        })),

      // Deal Won → project (stage = Project Initiate)
      convertLeadToProject: (leadId, o) => {
        const projectId = uid('p');
        setData((prev) => {
          const lead = prev.leads.find((l) => l.id === leadId);
          if (!lead) return prev;
          let { customers, users } = prev;
          let customerId = o.customerId;
          if (customerId === '__new') {
            customerId = uid('c');
            customers = [
              ...customers,
              { id: customerId, name: lead.company || lead.contactName, contactName: lead.contactName, email: lead.email, phone: lead.phone },
            ];
            const emailTaken = users.some((u) => u.email.toLowerCase() === (lead.email || '').toLowerCase());
            if (lead.email && !emailTaken) {
              users = [
                ...users,
                { id: uid('u'), role: 'customer', customerId, name: lead.contactName || lead.company, email: lead.email, password: 'welcome@123' },
              ];
            }
          }
          const customer = customers.find((c) => c.id === customerId);
          const project = {
            id: projectId,
            leadId,
            name: lead.title,
            clientName: customer?.name || lead.company,
            customerId,
            description: o.description || '',
            requirements: o.requirements || '',
            stage: 'INITIATE',
            startDate: o.startDate,
            endDate: o.endDate,
            contractValue: Number(o.contractValue) || 0,
            dev: { requirement: 0, ui: 0, frontend: 0, backend: 0 },
            team: o.team || [],
            clientApproved: false,
            clientNote: '',
            createdAt: todayISO(),
            closedAt: null,
          };
          return {
            ...prev,
            customers,
            users,
            projects: [project, ...prev.projects],
            leads: prev.leads.map((l) =>
              l.id === leadId
                ? {
                    ...l,
                    stage: 'WON',
                    wonAt: todayISO(),
                    projectId,
                    customerId,
                    value: project.contractValue,
                    stageHistory: [...(l.stageHistory || []), { stage: 'WON', at: todayISO() }],
                  }
                : l,
            ),
          };
        });
        return projectId;
      },

      // ----- projects -----
      updateProject: (id, patch) => setData((p) => ({ ...p, projects: patchList(p.projects, id, patch) })),
      setProjectStage: (id, stage) =>
        setData((p) => ({
          ...p,
          projects: patchList(p.projects, id, {
            stage,
            closedAt: stage === 'CLOSED' ? todayISO() : null,
          }),
        })),
      setDev: (id, key, value) =>
        setData((p) => ({
          ...p,
          projects: p.projects.map((x) =>
            x.id === id ? { ...x, dev: { ...x.dev, [key]: Math.max(0, Math.min(100, Number(value) || 0)) } } : x,
          ),
        })),
      toggleTeam: (id, staffId) =>
        setData((p) => ({
          ...p,
          projects: p.projects.map((x) =>
            x.id === id
              ? { ...x, team: x.team.includes(staffId) ? x.team.filter((s) => s !== staffId) : [...x.team, staffId] }
              : x,
          ),
        })),
      clientApprove: (id) =>
        setData((p) => ({
          ...p,
          projects: patchList(p.projects, id, { clientApproved: true, clientNote: '', stage: 'CLOSED', closedAt: todayISO() }),
        })),
      clientRequestChanges: (id, note) =>
        setData((p) => ({
          ...p,
          projects: patchList(p.projects, id, { clientApproved: false, clientNote: note, stage: 'CONFIRMATION_TESTING' }),
        })),

      // ----- finance -----
      addPayment: (pay) => setData((p) => ({ ...p, payments: [{ ...pay, id: uid('pay') }, ...p.payments] })),
      deletePayment: (id) => setData((p) => ({ ...p, payments: p.payments.filter((x) => x.id !== id) })),
      addExpenses: (list) =>
        setData((p) => ({ ...p, expenses: [...list.map((e) => ({ ...e, id: uid('e') })), ...p.expenses] })),
      deleteExpense: (id) => setData((p) => ({ ...p, expenses: p.expenses.filter((x) => x.id !== id) })),

      resetDemo: () => setData(buildSeed()),
    }),
    [],
  );

  const value = useMemo(() => ({ data, ...actions }), [data, actions]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);

// small helper hook for lookups
export const useLookups = () => {
  const { data } = useData();
  const staffById = useCallback((id) => data.staff.find((s) => s.id === id), [data.staff]);
  const projectById = useCallback((id) => data.projects.find((p) => p.id === id), [data.projects]);
  return { staffById, projectById };
};
