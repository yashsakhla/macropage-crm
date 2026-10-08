# MACROPAGE CRM

Lead generation → confirmed deals → projects → finance, with an Admin console and a Customer portal.

- `frontend/` — React 18 + Vite (ready to run, works offline with demo data)
- `BACKEND_PROMPT.md` — full prompt to generate the NestJS + Prisma + PostgreSQL backend

## Run the frontend

```bash
cd frontend
npm install
npm run dev        # opens http://localhost:5173
```

Requires Node 18+.

### Demo logins (pre-filled on the login screen)

| Role     | Email               | Password   |
| -------- | ------------------- | ---------- |
| Admin    | admin@macropage.in  | admin123   |
| Customer | client@demo.com     | client123  |
| Customer | hotel@demo.com      | client123  |

Demo data is stored in your browser's localStorage. To reset it, clear site data for localhost:5173 (or run `localStorage.clear()` in the console).

## What's inside

**Admin**
- **Dashboard** — total leads, confirmed leads, projects running / ongoing / closed, revenue, expenses, net, pipeline funnel, 6-month revenue vs expense chart, confirmed deals.
- **Lead Generation** — Kanban board (drag & drop) + list view across 11 stages: Lead → Lead Identified → Lead Generated → Lead Qualified → Demo / Presentation → Proposal / Quotation Sent → Negotiation → Verbal Confirmation → Payment / Contract Pending → Deal Won 🎉 / Cancelled. Create / edit leads, filters, stage values.
- **Deal Won → Project** — dropping a lead on *Deal Won* opens a conversion form (contract value, timeline, requirements, client account, team) and creates the project at **Project Initiate**.
- **Projects** — board by stage + list. Stages: Initiate → Started → In Progress → Testing → Cloud Setup → Server Setup → Confirmation Testing → Deployment → **Client Confirmation** → Closed.
- **Project details** — revenue, payment received / pending, expenses, earned & projected profit, timeline, team (engineers vs staff), requirements, four independent *In Progress* tracks (Requirement, UI, Frontend, Backend as %), payments, expenses with category / user breakdown.
- **Finance** — project-wise revenue / expense / margin, monthly chart, expense manager (one user, one project, **multiple categories** in a single entry), payments ledger.

**Customer portal**
- Own projects only: live stage + progress, dev tracks, payments & balance, team, requirements.
- At *Client Confirmation* the client can **Approve** (project closes) or **Request changes** (project goes back to Confirmation Testing).

## Folder structure

```
macropage-crm/
├── BACKEND_PROMPT.md
├── README.md
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── .env.example
    └── src/
        ├── main.jsx                  # providers + router
        ├── App.jsx                   # routes + role guards
        ├── styles/global.css         # MACROPAGE navy / orange theme
        ├── constants/index.js        # lead stages, project stages, dev tracks, expense categories
        ├── data/seed.js              # fictional demo data
        ├── context/
        │   ├── AuthContext.jsx       # login (admin / customer)
        │   ├── DataContext.jsx       # all CRUD actions (localStorage) — swap for API calls
        │   └── ToastContext.jsx
        ├── services/api.js           # fetch wrapper for the NestJS API (used after backend is live)
        ├── utils/
        │   ├── format.js             # ₹ formatting, dates
        │   └── metrics.js            # progress %, project finance, monthly series
        ├── components/
        │   ├── layout/AppLayout.jsx  # sidebar + topbar
        │   ├── ui/                   # Modal, StatCard, Badge, ProgressBar, charts…
        │   ├── leads/                # LeadFormModal, ConvertModal
        │   ├── projects/             # StageStepper, DevProgress
        │   └── finance/              # ExpenseModal, PaymentModal
        └── pages/
            ├── Login.jsx
            ├── admin/                # Dashboard, Leads, Projects, ProjectDetails, Finance
            └── customer/             # PortalHome, PortalProject
```

## Connecting the NestJS backend later

1. Generate the backend with `BACKEND_PROMPT.md` and run it on port 4000.
2. Copy `frontend/.env.example` to `.env` (sets `VITE_API_URL`).
3. In `src/context/DataContext.jsx`, replace each action body with the matching `api.post / api.patch / api.del` call from `src/services/api.js` (every action maps to one endpoint in the prompt), and load initial data with `api.get`.
4. In `AuthContext.jsx`, call `POST /auth/login` and store the returned JWT.

> Note: demo auth keeps passwords in browser storage purely for the offline demo. Real authentication must come from the backend (bcrypt + JWT).
