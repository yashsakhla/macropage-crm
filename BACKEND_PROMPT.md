# MACROPAGE CRM — NestJS Backend Prompt

Copy everything below the line into Claude Code / your AI coding tool, inside an empty `backend/` folder.

---

You are a senior NestJS engineer. Build the complete production-ready backend for **MACROPAGE CRM**, an internal CRM for a software company (MR Tech Solutions Pvt. Ltd.) that manages **lead generation → confirmed deals → projects → finance**. A React frontend already exists and expects the REST API described below. Generate the full project, runnable locally with one `docker compose up -d` + `npm run start:dev`.

## 1. Tech stack (mandatory)

- **NestJS** (latest stable) + **TypeScript** (strict)
- **PostgreSQL** via **Prisma ORM** (Docker Compose for local Postgres)
- **JWT auth** (access token 15 min + refresh token 7 days), `bcrypt` password hashing
- `class-validator` + `class-transformer` DTOs with a global `ValidationPipe` (`whitelist: true`, `transform: true`)
- **Swagger** at `/api/docs`
- Global prefix `/api`, CORS enabled for `http://localhost:5173` (configurable via env)
- `@nestjs/config` with env validation, `helmet`, `@nestjs/throttler` on auth routes
- Port **4000**

## 2. Conventions

- **Soft delete** everywhere: every table has `deletedAt DateTime?`. Encapsulate in a Prisma client extension / service helper so that all reads automatically exclude soft-deleted rows. Deletes only set `deletedAt`.
- All tables: `id` (cuid), `createdAt`, `updatedAt`, `deletedAt`.
- Money fields: `Decimal(14,2)` in DB, serialised to JS **numbers** in API responses.
- Dates: ISO strings. Date-only fields (`startDate`, `endDate`, `expectedClose`, `paidOn`, `spentOn`) are `YYYY-MM-DD`.
- Custom decorators: `@Roles('ADMIN' | 'CUSTOMER')`, `@CurrentUser()`, `@Public()`. A global `JwtAuthGuard` + `RolesGuard`.
- Consistent error shape `{ statusCode, message, error }`; a global exception filter maps Prisma errors (P2002 → 409, P2025 → 404).
- Pagination on list endpoints: `?page=1&limit=20&search=`; response `{ data, meta: { page, limit, total } }`. (Lead board and project board endpoints return full lists, no pagination.)
- Folder structure: feature modules — `auth`, `users`, `customers`, `staff`, `leads`, `projects`, `payments`, `expenses`, `finance`, `dashboard`, plus `common/` (decorators, guards, filters, interceptors) and `prisma/`.
- Write a seed script (`prisma/seed.ts`) that creates: 1 admin (`admin@macropage.in` / `admin123`), 7 staff, 4 customers (+ 2 customer logins: `client@demo.com`, `hotel@demo.com`, password `client123`), ~16 leads across all stages, 5 projects in different stages with payments and expenses (fictional data).

## 3. Roles

- **ADMIN** (MACROPAGE team): full access to everything.
- **CUSTOMER**: can log in to a client portal and **only** see projects where `project.customerId === user.customerId`. Customers never see expenses, profit, staff cost, leads or other customers. They can only call the client-confirmation endpoints.

## 4. Data model (Prisma)

```
enum Role { ADMIN CUSTOMER }

enum LeadStage {
  LEAD IDENTIFIED GENERATED QUALIFIED DEMO PROPOSAL NEGOTIATION
  VERBAL PENDING WON CANCELLED
}

enum ProjectStage {
  INITIATE STARTED IN_PROGRESS TESTING CLOUD_SETUP SERVER_SETUP
  CONFIRMATION_TESTING DEPLOYMENT CLIENT_CONFIRMATION CLOSED
}

enum StaffType { ENGINEER STAFF }

User        id, name, email (unique), passwordHash, role, customerId? -> Customer, isActive, refreshTokenHash?
Customer    id, name (company), contactName, email, phone, address?
Staff       id, name, role (job title string), type StaffType, email?, phone?, isActive
Lead        id, title, company, contactName, phone, email, source, value Decimal, stage LeadStage,
            ownerId -> Staff, expectedClose Date?, notes, wonAt?, customerId? -> Customer,
            projectId? (unique) -> Project, stageUpdatedAt
LeadStageHistory  id, leadId, fromStage?, toStage, changedById -> User, createdAt
Project     id, leadId (unique), customerId -> Customer, name, description, requirements (text),
            stage ProjectStage (default INITIATE), startDate, endDate, contractValue Decimal,
            progressRequirement Int(0-100), progressUi Int, progressFrontend Int, progressBackend Int,
            clientApproved Boolean default false, clientNote?, closedAt?
ProjectStageHistory  id, projectId, fromStage?, toStage, changedById, createdAt
ProjectStaff  projectId, staffId  (composite PK)  — the team on a project
Payment     id, projectId, amount Decimal, paidOn Date, mode (BANK_TRANSFER|UPI|CASH|CHEQUE|CARD), note?
Expense     id, projectId, staffId (the user the expense belongs to), category (enum below),
            amount Decimal, spentOn Date, note?
enum ExpenseCategory {
  SALARY FREELANCER SOFTWARE_TOOLS CLOUD_HOSTING DOMAIN_SSL TRAVEL MARKETING OFFICE_MISC
}
```

Add sensible indexes (`stage`, `ownerId`, `projectId`, `customerId`, `spentOn`, `paidOn`).

## 5. Business rules (critical)

### Leads
1. A lead starts at `LEAD`. Stages move freely forward/backward between `LEAD … PENDING` and to `CANCELLED`. Every change writes a `LeadStageHistory` row.
2. **A lead cannot be moved to `WON` through the normal stage endpoint.** Use `POST /leads/:id/convert` (below).
3. Once converted (`projectId` set) a lead is locked: stage cannot change and it cannot be deleted.

### Deal Won → Project conversion (single DB transaction)
`POST /leads/:id/convert` with `{ contractValue, startDate, endDate, customerId | "NEW", description?, requirements?, staffIds[] }`:
- Validate `contractValue > 0` and `endDate >= startDate`; lead must not already be converted or cancelled.
- If `customerId === "NEW"`: create a `Customer` from the lead's company/contact. If the lead has an email and no user exists with it, create a CUSTOMER `User` with a random temporary password and (stub) send an invite — log it and expose the temporary password only in non-production.
- Create the `Project` at stage `INITIATE`, all four progress values `0`, attach `staffIds`.
- Set lead `stage = WON`, `wonAt = now`, `projectId`, `customerId`, `value = contractValue`.
- Write both history rows. Return the created project.

### Project lifecycle
- Stage order: INITIATE → STARTED → IN_PROGRESS → TESTING → CLOUD_SETUP → SERVER_SETUP → CONFIRMATION_TESTING → DEPLOYMENT → **CLIENT_CONFIRMATION** → CLOSED.
- Admin may move to any stage (forward or back) via `PATCH /projects/:id/stage`, **except** `CLOSED`, which is only allowed when `clientApproved === true`.
- `IN_PROGRESS` has four independent tracks (0–100 each): `requirement`, `ui`, `frontend`, `backend`. Frontend and backend are independent of each other.
- **Client confirmation**: when stage is `CLIENT_CONFIRMATION`, the customer can
  - `POST /portal/projects/:id/approve` → `clientApproved = true`, `stage = CLOSED`, `closedAt = now`
  - `POST /portal/projects/:id/request-changes { note }` → `clientApproved = false`, `clientNote = note`, `stage = CONFIRMATION_TESTING`
  - Both endpoints return 403 if the project is not the customer's own, and 409 if the stage is not `CLIENT_CONFIRMATION`.
  - Admin has `POST /projects/:id/record-client-approval` (same effect as approve, for offline approvals).
- **Overall progress %** (computed field `progress` on every project response):
  - INITIATE 5, STARTED 12, TESTING 65, CLOUD_SETUP 72, SERVER_SETUP 79, CONFIRMATION_TESTING 86, DEPLOYMENT 92, CLIENT_CONFIRMATION 97, CLOSED 100
  - IN_PROGRESS = `round(12 + average(four tracks) * 0.53)`

### Finance (computed per project, never stored)
```
contract  = project.contractValue
received  = SUM(payments.amount)
pending   = max(contract - received, 0)
spent     = SUM(expenses.amount)
net       = received - spent            // cash earned so far
projected = contract - spent            // profit once fully paid
margin    = contract ? round((contract - spent) / contract * 100) : 0
```
- Expenses are created in **batches**: one request can contain a project, a staff member, a date, and **multiple category lines** — each line becomes its own `Expense` row (this is the "multiple categories per user" requirement).

### Dashboard definitions
- Total lead generations = all leads. Confirmed leads = stage `WON`.
- Projects running = stage ≠ `CLOSED`. Projects ongoing = stage ∉ {`INITIATE`, `CLOSED`}. Projects closed = stage `CLOSED`.
- Revenue generated = SUM of all payments received.

## 6. REST API

All routes under `/api`. ADMIN unless stated. Return the shapes the frontend already uses (camelCase, numbers for money, `YYYY-MM-DD` dates).

**Auth** (`@Public` for login/refresh)
- `POST /auth/login` `{ email, password, role }` → `{ accessToken, refreshToken, user }` (reject if the user's role ≠ requested `role`, since the login screen has Admin / Customer toggle)
- `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
- `POST /auth/change-password`

**Leads**
- `GET /leads?stage=&ownerId=&source=&search=` (full list for the Kanban board)
- `POST /leads`, `GET /leads/:id`, `PATCH /leads/:id`, `DELETE /leads/:id` (soft)
- `PATCH /leads/:id/stage` `{ stage }` (not `WON`)
- `POST /leads/:id/convert` (see rules)
- `GET /leads/stats` → `{ total, inPipeline, pipelineValue, won, wonValue, cancelled, winRate }`

**Projects**
- `GET /projects?stage=&status=running|closed&search=`
- `GET /projects/:id` → full detail incl. `progress`, `finance` block, `team[]` with `engineerCount`/`staffCount`, stage history
- `PATCH /projects/:id` (description, requirements, startDate, endDate, contractValue)
- `PATCH /projects/:id/stage`, `PATCH /projects/:id/progress` `{ requirement?, ui?, frontend?, backend? }` (clamp 0–100)
- `PUT /projects/:id/team` `{ staffIds: [] }`
- `POST /projects/:id/record-client-approval`
- `GET /projects/:id/payments`, `GET /projects/:id/expenses`
- **Internal projects** (our own business, no client/contract): `GET/POST /internal-projects`, `GET/PATCH/DELETE /internal-projects/:id`. Fields: `name`, `description?`, `status` (`PLANNED|ACTIVE|ON_HOLD|COMPLETED`), `budget?`, `startDate?`, `endDate?`. An `Expense` has either `projectId` or `internalProjectId` (exactly one); `POST /expenses/batch` accepts either; `GET /expenses` also supports `?internalProjectId=`. Internal expenses count in `/finance/summary`, `/finance/monthly`, `/finance/expenses/by-category` and dashboard `money.expenses`, but never appear in `/finance/projects` rows or the customer portal. Deleting an internal project deletes its expenses.
- **Company / owner expenses** (not tied to any project): `Expense.scope` enum `PROJECT | INTERNAL_PROJECT | COMPANY | OWNER`. `PROJECT` requires `projectId`, `INTERNAL_PROJECT` requires `internalProjectId`, `COMPANY`/`OWNER` require neither (both null) and `staffId` is optional for them. `POST /expenses/batch` accepts `scope` and validates this; `GET /expenses` and `GET /finance/expenses/by-user` accept `?scope=`. COMPANY/OWNER expenses count in all totals (summary, monthly, by-category, dashboard) but never appear in `/finance/projects` or the portal. Existing rows migrate to `PROJECT`.

**Payments**: `POST /payments`, `PATCH /payments/:id`, `DELETE /payments/:id` (soft), `GET /payments?projectId=&from=&to=`
**Expenses**: `POST /expenses/batch` `{ projectId, staffId, spentOn, lines: [{ category, amount, note? }] }`, `PATCH /expenses/:id`, `DELETE /expenses/:id` (soft), `GET /expenses?projectId=&category=&staffId=&from=&to=`

**Finance** (aggregations done in SQL / Prisma groupBy)
- `GET /finance/summary` → `{ contractValue, received, pending, expenses, net, projected }`
- `GET /finance/projects` → per-project finance rows (as formula above)
- `GET /finance/monthly?months=6` → `[{ month: "2026-05", revenue, expense }]`
- `GET /finance/expenses/by-category`, `GET /finance/expenses/by-user?projectId=&from=&to=` (each user with total and per-category split)

**Dashboard**
- `GET /dashboard` → `{ counts: { leads, confirmedLeads, projectsRunning, projectsOngoing, projectsClosed, awaitingClient }, money: { revenue, booked, expenses, net }, funnel: [{ stage, count }], runningProjects: [...], confirmedDeals: [...], recentLeads: [...], monthly: [...] }`

**Master data**
- `GET/POST/PATCH/DELETE /staff`, `GET/POST/PATCH/DELETE /customers`, `GET/POST/PATCH /users` (admin manages customer logins; `POST /users/:id/reset-password`)

**Client portal** (`@Roles('CUSTOMER')`)
- `GET /portal/projects` — only the caller's projects (no expense/profit fields)
- `GET /portal/projects/:id` — progress, stage, dev tracks, timeline, requirements, payments summary (contract / paid / balance + payment list), team names & job titles only
- `POST /portal/projects/:id/approve`, `POST /portal/projects/:id/request-changes`

## 7. Non-functional requirements

- Unit tests for: stage-change rules, convert-lead transaction, finance calculations, progress calculation, and customer data-isolation in the portal.
- Prisma migrations committed; `npm run seed` script; `.env.example` (`DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `PORT`, `CORS_ORIGIN`).
- `docker-compose.yml` with Postgres 16 + (optional) pgAdmin.
- `README.md` with setup steps, seeded credentials, and a table mapping each frontend screen to its endpoints.
- Never return `passwordHash` or token hashes. Log in/out and conversion events with the Nest `Logger`.

## 8. Deliverables

Complete source code for every file (not snippets): `prisma/schema.prisma`, migrations, seed, all modules (controller, service, DTOs), guards/decorators/filters, `main.ts`, `app.module.ts`, Docker Compose, `.env.example`, tests, README. Finish by listing the exact commands to run it locally and to verify with the seeded admin login via Swagger.
