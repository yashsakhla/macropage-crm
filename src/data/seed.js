import { addDaysISO } from '../utils/format.js';

const ago = (n) => addDaysISO(-n);
const ahead = (n) => addDaysISO(n);

// All names / amounts below are fictional demo data.
export function buildSeed() {
  const staff = [
    { id: 's1', name: 'Rohit Verma', role: 'Frontend Developer', type: 'Engineer' },
    { id: 's2', name: 'Neha Sharma', role: 'Backend Developer', type: 'Engineer' },
    { id: 's3', name: 'Ankit Das', role: 'Full Stack Developer', type: 'Engineer' },
    { id: 's4', name: 'Pooja Singh', role: 'UI/UX Designer', type: 'Staff' },
    { id: 's5', name: 'Imran Khan', role: 'QA Tester', type: 'Staff' },
    { id: 's6', name: 'Karan Mehta', role: 'DevOps Engineer', type: 'Engineer' },
    { id: 's7', name: 'Simran Kaur', role: 'Sales Executive', type: 'Staff' },
  ];

  const customers = [
    { id: 'c1', name: 'Sharma Traders', contactName: 'Rakesh Sharma', email: 'client@demo.com', phone: '9876500011' },
    { id: 'c2', name: 'Greenleaf Hotels', contactName: 'Anita Rao', email: 'hotel@demo.com', phone: '9876500022' },
    { id: 'c3', name: 'Nova Fuels', contactName: 'Vikas Jain', email: 'vikas@novafuels.example', phone: '9876500033' },
    { id: 'c4', name: 'Sunrise Uniforms', contactName: 'Deepak Soni', email: 'deepak@sunrise.example', phone: '9876500044' },
  ];

  const users = [
    { id: 'u-admin', role: 'admin', name: 'Nitish Thakur', email: 'admin@macropage.in', password: 'admin123' },
    { id: 'u-c1', role: 'customer', customerId: 'c1', name: 'Rakesh Sharma', email: 'client@demo.com', password: 'client123' },
    { id: 'u-c2', role: 'customer', customerId: 'c2', name: 'Anita Rao', email: 'hotel@demo.com', password: 'client123' },
  ];

  const hist = (...pairs) => pairs.map(([stage, d]) => ({ stage, at: ago(d) }));

  const lead = (id, o) => ({
    id,
    title: '',
    company: '',
    contactName: '',
    phone: '',
    email: '',
    source: 'Referral',
    value: 0,
    owner: 's7',
    notes: '',
    stage: 'LEAD',
    createdAt: ago(10),
    expectedClose: ahead(30),
    projectId: null,
    customerId: null,
    visibleToClient: false,
    showValueToClient: false,
    ...o,
    stageHistory: o.stageHistory || [{ stage: 'LEAD', at: o.createdAt || ago(10) }],
  });

  const leads = [
    // open pipeline
    lead('l1', { title: 'Restaurant ordering app', company: 'Spice Route Cafe', contactName: 'Manoj Gupta', phone: '9811100001', email: 'manoj@spiceroute.example', source: 'Website', value: 180000, stage: 'LEAD', createdAt: ago(1) }),
    lead('l2', { title: 'School ERP portal', company: 'Little Stars School', contactName: 'Mrs. Pandey', phone: '9811100002', source: 'Referral', value: 350000, stage: 'LEAD', createdAt: ago(2) }),
    lead('l3', { title: 'Clinic appointment website', company: 'CarePlus Clinic', contactName: 'Dr. Arora', phone: '9811100003', email: 'arora@careplus.example', source: 'LinkedIn', value: 90000, stage: 'IDENTIFIED', createdAt: ago(4) }),
    lead('l4', { title: 'Inventory & billing software', company: 'Raj Hardware', contactName: 'Raj Patel', phone: '9811100004', source: 'Cold Call', value: 240000, stage: 'GENERATED', createdAt: ago(6) }),
    lead('l5', { title: 'Real-estate listing platform', company: 'Skyline Properties', contactName: 'Aman Verma', phone: '9811100005', email: 'aman@skyline.example', source: 'Event / Quiz', value: 520000, stage: 'QUALIFIED', createdAt: ago(9), notes: 'Needs agent login, listings, lead capture and WhatsApp alerts.', customerId: 'c1', visibleToClient: true, stageHistory: hist(['LEAD', 9], ['IDENTIFIED', 7], ['GENERATED', 5], ['QUALIFIED', 2]) }),
    lead('l6', { title: 'Gym membership app', company: 'FitZone Gym', contactName: 'Sandeep Rao', phone: '9811100006', source: 'WhatsApp', value: 160000, stage: 'DEMO', createdAt: ago(14) }),
    lead('l7', { title: 'Logistics tracking dashboard', company: 'Apex Logistics', contactName: 'Harpreet Singh', phone: '9811100007', email: 'harpreet@apex.example', source: 'Referral', value: 640000, stage: 'PROPOSAL', createdAt: ago(18), customerId: 'c1', visibleToClient: true, showValueToClient: true, stageHistory: hist(['LEAD', 18], ['QUALIFIED', 14], ['DEMO', 9], ['PROPOSAL', 3]) }),
    lead('l8', { title: 'Pharmacy POS', company: 'MediKart', contactName: 'Nisha Jain', phone: '9811100008', source: 'Website', value: 300000, stage: 'NEGOTIATION', createdAt: ago(22), customerId: 'c2', visibleToClient: true, stageHistory: hist(['LEAD', 22], ['QUALIFIED', 17], ['DEMO', 12], ['PROPOSAL', 8], ['NEGOTIATION', 2]) }),
    lead('l9', { title: 'Coaching institute LMS', company: 'BrightPath Academy', contactName: 'Suresh Kumar', phone: '9811100009', email: 'suresh@brightpath.example', source: 'Existing Client', value: 450000, stage: 'VERBAL', createdAt: ago(27) }),
    lead('l10', { title: 'Wholesale B2B ordering app', company: 'Kapoor Distributors', contactName: 'Yash Kapoor', phone: '9811100010', source: 'Referral', value: 380000, stage: 'PENDING', createdAt: ago(31) }),
    // cancelled
    lead('l11', { title: 'Event booking website', company: 'PartyPlanners', contactName: 'Ritu Sethi', phone: '9811100011', source: 'Cold Call', value: 120000, stage: 'CANCELLED', createdAt: ago(40) }),
    // won → converted to projects
    lead('lw1', { title: 'Hotel Booking & Management App', company: 'Greenleaf Hotels', contactName: 'Anita Rao', email: 'hotel@demo.com', value: 650000, stage: 'WON', createdAt: ago(95), wonAt: ago(78), projectId: 'p1', customerId: 'c2' }),
    lead('lw2', { title: 'Fuel Pump Management System', company: 'Nova Fuels', contactName: 'Vikas Jain', value: 420000, stage: 'WON', createdAt: ago(110), wonAt: ago(95), projectId: 'p2', customerId: 'c3' }),
    lead('lw3', { title: 'E-commerce Mobile App', company: 'Sharma Traders', contactName: 'Rakesh Sharma', email: 'client@demo.com', value: 600000, stage: 'WON', createdAt: ago(130), wonAt: ago(115), projectId: 'p3', customerId: 'c1' }),
    lead('lw4', { title: 'Staff Management App', company: 'Sunrise Uniforms', contactName: 'Deepak Soni', value: 380000, stage: 'WON', createdAt: ago(12), wonAt: ago(3), projectId: 'p4', customerId: 'c4' }),
    lead('lw5', { title: 'Company Website', company: 'Sharma Traders', contactName: 'Rakesh Sharma', email: 'client@demo.com', value: 85000, stage: 'WON', createdAt: ago(170), wonAt: ago(160), projectId: 'p5', customerId: 'c1' }),
  ];

  const project = (id, o) => ({
    id,
    leadId: null,
    name: '',
    clientName: '',
    customerId: null,
    description: '',
    requirements: '',
    stage: 'INITIATE',
    startDate: ago(10),
    endDate: ahead(60),
    contractValue: 0,
    dev: { requirement: 0, ui: 0, frontend: 0, backend: 0 },
    team: [],
    clientApproved: false,
    clientNote: '',
    createdAt: ago(10),
    closedAt: null,
    ...o,
  });

  const projects = [
    project('p1', {
      leadId: 'lw1', name: 'Hotel Booking & Management App', clientName: 'Greenleaf Hotels', customerId: 'c2',
      description: 'Room booking, front-desk management, housekeeping and billing — web admin plus guest mobile app.',
      requirements: '• Room inventory & rate plans\n• Online booking + payment gateway\n• Front-desk check-in / check-out\n• Housekeeping tasks\n• GST-ready invoices\n• Admin reports',
      stage: 'IN_PROGRESS', startDate: ago(75), endDate: ahead(45), contractValue: 650000,
      dev: { requirement: 100, ui: 90, frontend: 65, backend: 45 }, team: ['s1', 's2', 's4', 's6'], createdAt: ago(78),
    }),
    project('p2', {
      leadId: 'lw2', name: 'Fuel Pump Management System', clientName: 'Nova Fuels', customerId: 'c3',
      description: 'Shift-wise sales, tank stock, credit customers and daily reconciliation for fuel pumps.',
      requirements: '• Nozzle-wise sales entry\n• Tank dip & stock\n• Credit customer ledger\n• Daily reconciliation report',
      stage: 'TESTING', startDate: ago(90), endDate: ahead(10), contractValue: 420000,
      dev: { requirement: 100, ui: 100, frontend: 100, backend: 100 }, team: ['s2', 's3', 's5'], createdAt: ago(95),
    }),
    project('p3', {
      leadId: 'lw3', name: 'E-commerce Mobile App', clientName: 'Sharma Traders', customerId: 'c1',
      description: 'Customer-facing shopping app with catalogue, cart, UPI checkout and order tracking.',
      requirements: '• Catalogue & search\n• Cart & checkout (UPI / COD)\n• Order tracking\n• Admin panel for products & orders',
      stage: 'CLIENT_CONFIRMATION', startDate: ago(110), endDate: ahead(5), contractValue: 600000,
      dev: { requirement: 100, ui: 100, frontend: 100, backend: 100 }, team: ['s1', 's2', 's3', 's4', 's5', 's6'], createdAt: ago(115),
    }),
    project('p4', {
      leadId: 'lw4', name: 'Staff Management App', clientName: 'Sunrise Uniforms', customerId: 'c4',
      description: 'Multi-role staff, attendance and order management app for a uniform manufacturer.',
      requirements: '• Roles: owner, manager, tailor, delivery\n• Attendance\n• Order assignment & status\n• Monthly payroll sheet',
      stage: 'INITIATE', startDate: ahead(5), endDate: ahead(95), contractValue: 380000, team: ['s3', 's4'], createdAt: ago(3),
    }),
    project('p5', {
      leadId: 'lw5', name: 'Company Website', clientName: 'Sharma Traders', customerId: 'c1',
      description: 'Corporate website with product pages, enquiry form and SEO basics.',
      requirements: '• 8-page responsive website\n• Enquiry form with email alerts\n• Basic SEO',
      stage: 'CLOSED', startDate: ago(155), endDate: ago(100), contractValue: 85000,
      dev: { requirement: 100, ui: 100, frontend: 100, backend: 100 }, team: ['s1', 's4'], clientApproved: true, createdAt: ago(160), closedAt: ago(98),
    }),
  ];

  const pay = (id, projectId, amount, d, mode, note) => ({ id, projectId, amount, date: ago(d), mode, note });
  const payments = [
    pay('pay1', 'p1', 250000, 70, 'Bank Transfer', 'Advance 40%'),
    pay('pay2', 'p1', 150000, 20, 'UPI', 'Milestone — UI approved'),
    pay('pay3', 'p2', 210000, 88, 'Bank Transfer', 'Advance 50%'),
    pay('pay4', 'p2', 100000, 40, 'Cheque', 'Milestone — backend'),
    pay('pay5', 'p3', 300000, 105, 'Bank Transfer', 'Advance 50%'),
    pay('pay6', 'p3', 200000, 30, 'Bank Transfer', 'Milestone — app build'),
    pay('pay7', 'p4', 50000, 3, 'UPI', 'Booking amount'),
    pay('pay8', 'p5', 40000, 150, 'UPI', 'Advance'),
    pay('pay9', 'p5', 45000, 98, 'Bank Transfer', 'Final payment'),
  ];

  const ex = (id, projectId, userId, category, amount, d, note) => ({ id, projectId, userId, category, amount, date: ago(d), note });
  const expenses = [
    ex('e1', 'p1', 's1', 'Salary', 45000, 35, 'Frontend — monthly share'),
    ex('e2', 'p1', 's2', 'Salary', 50000, 35, 'Backend — monthly share'),
    ex('e3', 'p1', 's4', 'Salary', 30000, 35, 'UI/UX — monthly share'),
    ex('e4', 'p1', 's6', 'Cloud & Hosting', 8200, 15, 'Staging servers'),
    ex('e5', 'p1', 's4', 'Software & Tools', 3500, 50, 'Design assets'),
    ex('e6', 'p2', 's2', 'Salary', 60000, 60, 'Backend share'),
    ex('e7', 'p2', 's3', 'Salary', 55000, 60, 'Full stack share'),
    ex('e8', 'p2', 's5', 'Salary', 20000, 30, 'QA share'),
    ex('e9', 'p2', 's3', 'Travel', 4800, 45, 'Site visit — pump survey'),
    ex('e10', 'p3', 's1', 'Salary', 70000, 80, 'Frontend share'),
    ex('e11', 'p3', 's2', 'Salary', 70000, 80, 'Backend share'),
    ex('e12', 'p3', 's4', 'Salary', 35000, 80, 'UI/UX share'),
    ex('e13', 'p3', 's6', 'Cloud & Hosting', 12000, 25, 'Production cloud'),
    ex('e14', 'p3', 's6', 'Domain & SSL', 2400, 25, 'Domain + SSL'),
    ex('e15', 'p3', 's3', 'Freelancer / Outsourcing', 25000, 55, 'Payment gateway integration'),
    ex('e16', 'p4', 's7', 'Marketing', 2000, 2, 'Client onboarding kit'),
    ex('e17', 'p5', 's1', 'Salary', 30000, 120, 'Website build'),
    ex('e18', 'p5', 's4', 'Salary', 15000, 125, 'Design'),
    ex('e19', 'p5', 's6', 'Domain & SSL', 1800, 110, 'Domain'),
  ];

  return { staff, customers, users, leads, projects, payments, expenses };
}
