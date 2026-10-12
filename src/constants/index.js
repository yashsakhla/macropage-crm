// ---------- Lead pipeline ----------
export const LEAD_STAGES = [
  { key: 'LEAD', label: 'Lead', hint: 'New enquiry received', color: '#64748b' },
  { key: 'IDENTIFIED', label: 'Lead Identified', hint: 'Potential customer has been identified', color: '#6366f1' },
  { key: 'GENERATED', label: 'Lead Generated', hint: 'Lead / contact information captured', color: '#8b5cf6' },
  { key: 'QUALIFIED', label: 'Lead Qualified', hint: 'Fits target profile and has a genuine need', color: '#0ea5e9' },
  { key: 'DEMO', label: 'Demo / Presentation', hint: 'Product or service has been demonstrated', color: '#06b6d4' },
  { key: 'PROPOSAL', label: 'Proposal / Quotation Sent', hint: 'Pricing and proposal shared', color: '#14b8a6' },
  { key: 'NEGOTIATION', label: 'Negotiation', hint: 'Discussing pricing, terms, features', color: '#f59e0b' },
  { key: 'VERBAL', label: 'Verbal Confirmation', hint: 'Customer agreed in principle', color: '#f97316' },
  { key: 'PENDING', label: 'Payment / Contract Pending', hint: 'Awaiting payment, PO, agreement or contract', color: '#ef4444' },
  { key: 'WON', label: 'Deal Won 🎉', hint: 'Payment / contract confirmed — deal closed', color: '#16a34a' },
  { key: 'CANCELLED', label: 'Cancelled', hint: 'Deal cancelled or lost', color: '#475569' },
];
export const LEAD_STAGE_MAP = Object.fromEntries(LEAD_STAGES.map((s) => [s.key, s]));

export const LEAD_SOURCES = ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'WhatsApp', 'Event / Quiz', 'Existing Client', 'Other'];

// ---------- Project lifecycle ----------
export const PROJECT_STAGES = [
  { key: 'INITIATE', label: 'Project Initiate', hint: 'Requirements, timeline and revenue captured', color: '#64748b' },
  { key: 'STARTED', label: 'Project Started', hint: 'Kick-off done, team assigned', color: '#6366f1' },
  { key: 'IN_PROGRESS', label: 'In Progress', hint: 'Requirement, UI, Frontend, Backend work', color: '#0ea5e9' },
  { key: 'TESTING', label: 'Testing', hint: 'Internal QA', color: '#f59e0b' },
  { key: 'CLOUD_SETUP', label: 'Cloud Setup', hint: 'Cloud accounts, DB, storage', color: '#14b8a6' },
  { key: 'SERVER_SETUP', label: 'Server Setup', hint: 'Servers, domain, SSL, CI/CD', color: '#8b5cf6' },
  { key: 'CONFIRMATION_TESTING', label: 'Confirmation Testing', hint: 'Final check on live environment', color: '#f97316' },
  { key: 'DEPLOYMENT', label: 'Deployment', hint: 'Go-live', color: '#ec4899' },
  { key: 'CLIENT_CONFIRMATION', label: 'Client Confirmation', hint: 'Client tests and approves', color: '#ef4444' },
  { key: 'CLOSED', label: 'Project Closed', hint: 'Delivered and closed', color: '#16a34a' },
];
// Plan the client actually selected — captured when the deal is closed (Deal Won)
export const PROJECT_PLANS = [
  { key: 'PRO', label: 'Pro', color: '#0ea5e9' },
  { key: 'PREMIUM', label: 'Premium', color: '#f59e0b' },
];
export const PLAN_MAP = Object.fromEntries(PROJECT_PLANS.map((p) => [p.key, p]));

export const PROJECT_STAGE_MAP =Object.fromEntries(PROJECT_STAGES.map((s) => [s.key, s]));

// Sub-levels inside "In Progress" — each tracked as an independent percentage
export const DEV_TRACKS = [
  { key: 'requirement', label: 'Requirement Gathering', color: '#6366f1' },
  { key: 'ui', label: 'UI Development (UX Developer)', color: '#ec4899' },
  { key: 'frontend', label: 'Frontend Development', color: '#0ea5e9' },
  { key: 'backend', label: 'Backend Development', color: '#16a34a' },
];

// ---------- Hustlers (team members & lead owners) ----------
// Each hustler has exactly one role. The label is what the backend stores in `role`;
// `engineer` roles are sent with type ENGINEER, the rest with STAFF. Every hustler can be a lead owner or a team member.
export const HUSTLER_ROLES = [
  { label: 'Lead Owner', color: '#f26522' },
  { label: 'Freelancer Lead Owner', color: '#f59e0b' },
  { label: 'Sales Executive', color: '#f97316' },
  { label: 'Business Analyst', color: '#6366f1' },
  { label: 'Project Manager', color: '#4f46e5' },
  { label: 'Project Co-ordinator', color: '#7c3aed' },
  { label: 'Tech Lead', color: '#0f766e', engineer: true },
  { label: 'Full Stack Developer', color: '#0ea5e9', engineer: true },
  { label: 'Frontend Developer', color: '#06b6d4', engineer: true },
  { label: 'Backend Developer', color: '#16a34a', engineer: true },
  { label: 'Mobile App Developer', color: '#22c55e', engineer: true },
  { label: 'UX/UI Developer', color: '#db2777', engineer: true },
  { label: 'QA / Test Engineer', color: '#d97706', engineer: true },
  { label: 'DevOps Engineer', color: '#0891b2', engineer: true },
  { label: 'Cloud Engineer (Server Manager)', color: '#14b8a6', engineer: true },
  { label: 'Freelance Developer', color: '#8b5cf6', engineer: true },
  { label: 'Freelance UX / UI Developer', color: '#ec4899', engineer: true },
  { label: 'Digital Marketing Executive', color: '#ea580c' },
  { label: 'Accountant', color: '#64748b' },
];
export const HUSTLER_ROLE_MAP = Object.fromEntries(HUSTLER_ROLES.map((r) => [r.label, r]));

// ---------- Finance ----------
// `key` is the label shown in the UI; `api` is the enum value the backend stores.
export const EXPENSE_CATEGORIES = [
  { key: 'Salary', api: 'SALARY', color: '#4f46e5' },
  { key: 'Freelancer / Outsourcing', api: 'FREELANCER', color: '#8b5cf6' },
  { key: 'Software & Tools', api: 'SOFTWARE_TOOLS', color: '#0ea5e9' },
  { key: 'Cloud & Hosting', api: 'CLOUD_HOSTING', color: '#14b8a6' },
  { key: 'Domain & SSL', api: 'DOMAIN_SSL', color: '#22c55e' },
  { key: 'Travel', api: 'TRAVEL', color: '#f59e0b' },
  { key: 'Marketing', api: 'MARKETING', color: '#f97316' },
  { key: 'Office & Misc', api: 'OFFICE_MISC', color: '#64748b' },
];
export const CATEGORY_COLOR = Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.key, c.color]));
export const CATEGORY_TO_API = Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.key, c.api]));
export const CATEGORY_FROM_API = Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.api, c.key]));

export const PAYMENT_MODE_LIST = [
  { label: 'Bank Transfer', api: 'BANK_TRANSFER' },
  { label: 'UPI', api: 'UPI' },
  { label: 'Cash', api: 'CASH' },
  { label: 'Cheque', api: 'CHEQUE' },
  { label: 'Card', api: 'CARD' },
];
export const PAYMENT_MODES = PAYMENT_MODE_LIST.map((m) => m.label);
export const MODE_TO_API = Object.fromEntries(PAYMENT_MODE_LIST.map((m) => [m.label, m.api]));
export const MODE_FROM_API = Object.fromEntries(PAYMENT_MODE_LIST.map((m) => [m.api, m.label]));

// ---------- Work status ----------
export const PROJECT_WORK_TYPES = [
  'Frontend Development',
  'Backend Development',
  'Server Setup',
  'Architecture Design',
  'System Design',
  'Database Design',
  'API Integration',
  'UI/UX Design',
  'Testing & QA',
  'Deployment / DevOps',
  'Bug Fixing',
  'Project Management',
  'Client Coordination',
  'Documentation',
  'Other Tech Work',
  'Other Business Work',
];

export const LEAD_WORK_TYPES = [
  'Client Discussion',
  'Client Meeting',
  'Client Negotiation',
  'Client Documentation',
  'Requirement Gathering',
  'Quotation / Proposal',
  'Follow-up',
  'Other Business Work',
];

export const WORK_STATUSES = [
  { key: 'IN_PROGRESS', label: 'In progress', color: '#0ea5e9' },
  { key: 'DONE', label: 'Done', color: '#16a34a' },
  { key: 'BLOCKED', label: 'Blocked', color: '#dc2626' },
];
export const WORK_STATUS_MAP = Object.fromEntries(WORK_STATUSES.map((s) => [s.key, s]));

export const INTERNAL_STATUSES = [
  { key: "PLANNED", label: "Planned", color: "#64748b" },
  { key: "ACTIVE", label: "Active", color: "#0ea5e9" },
  { key: "ON_HOLD", label: "On hold", color: "#d97706" },
  { key: "COMPLETED", label: "Completed", color: "#16a34a" },
];
export const INTERNAL_STATUS_MAP = Object.fromEntries(INTERNAL_STATUSES.map((s) => [s.key, s]));
