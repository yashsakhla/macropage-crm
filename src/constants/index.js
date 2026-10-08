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
export const PROJECT_STAGE_MAP = Object.fromEntries(PROJECT_STAGES.map((s) => [s.key, s]));

// Sub-levels inside "In Progress" — each tracked as an independent percentage
export const DEV_TRACKS = [
  { key: 'requirement', label: 'Requirement Gathering', color: '#6366f1' },
  { key: 'ui', label: 'UI Development (UX Developer)', color: '#ec4899' },
  { key: 'frontend', label: 'Frontend Development', color: '#0ea5e9' },
  { key: 'backend', label: 'Backend Development', color: '#16a34a' },
];

// ---------- Finance ----------
export const EXPENSE_CATEGORIES = [
  { key: 'Salary', color: '#4f46e5' },
  { key: 'Freelancer / Outsourcing', color: '#8b5cf6' },
  { key: 'Software & Tools', color: '#0ea5e9' },
  { key: 'Cloud & Hosting', color: '#14b8a6' },
  { key: 'Domain & SSL', color: '#22c55e' },
  { key: 'Travel', color: '#f59e0b' },
  { key: 'Marketing', color: '#f97316' },
  { key: 'Office & Misc', color: '#64748b' },
];
export const CATEGORY_COLOR = Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.key, c.color]));

export const PAYMENT_MODES = ['Bank Transfer', 'UPI', 'Cash', 'Cheque', 'Card'];
