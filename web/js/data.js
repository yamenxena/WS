// Majaz AI OS — Dashboard Data
// Mirrors workspace simulation data from operations/*.md

const DATA = {
  // --- CRM Pipeline ---
  leads: [
    { id: 'L001', name: 'Nasser Al-Suwaidi', source: 'Instagram DM', type: 'Villa', status: 'New', icp: 4, budget: '3.5M', location: 'Al Shamkha, AD', next: 'Respond to DM', added: '2026-03-19', daysSince: 2, overdue: true, notes: '⚠️ NO RESPONSE — 2 DAYS' },
    { id: 'L002', name: 'Layla Khoury', source: 'Referral', type: 'Villa', status: 'New', icp: 3, budget: '2M', location: 'MBZ City, AD', next: 'Initial call', added: '2026-03-20', daysSince: 1, overdue: false },
    { id: 'L003', name: 'Rami Haddad', source: 'Website', type: 'Villa', status: 'New', icp: 2, budget: '800K', location: 'Al Ain', next: 'Qualify — below ICP?', added: '2026-03-21', daysSince: 0, overdue: false },
    { id: 'L004', name: 'Ahmed Al-Khatib', source: 'Instagram/WhatsApp', type: 'Villa', status: 'Contacted', icp: 5, budget: '4.5M', location: 'Reem Island, AD', next: 'Meeting confirmation', added: '2026-03-18', daysSince: 3, overdue: true, notes: '⚠️ 48h waiting' },
    { id: 'L005', name: 'Diana Mostafa', source: 'Referral', type: 'Villa', status: 'Contacted', icp: 4, budget: '3M', location: 'Saadiyat, AD', next: 'Send portfolio', added: '2026-03-15', daysSince: 6, overdue: true, notes: '⚠️ 6 days no follow-up' },
    { id: 'L006', name: 'Hassan Al-Blooshi', source: 'Direct', type: 'Villa', status: 'Qualified', icp: 5, budget: '6M', location: 'Saadiyat, AD', next: 'Meeting Mar 25', added: '2026-03-10', daysSince: 11, overdue: false },
    { id: 'L007', name: 'Aisha bin Zayed', source: 'Instagram', type: 'Villa', status: 'Qualified', icp: 4, budget: '4M', location: 'Yas Island, AD', next: 'Send brief questionnaire', added: '2026-03-12', daysSince: 9, overdue: false },
    { id: 'L008', name: 'Omar bin Rashid', source: 'Referral', type: 'Townhouse', status: 'Proposal Sent', icp: 4, budget: '2.5M', location: 'Khalifa City, AD', next: 'Negotiate scope', added: '2026-02-01', daysSince: 48, overdue: false, notes: 'Stalled — wants scope reduction' },
    { id: 'L009', name: 'Khalid Al-Mansouri', source: 'Direct', type: 'Villa', status: 'Won', icp: 5, budget: '5.2M', location: 'Reem Island, AD', next: 'Active — Villa Al-Reem', added: '2026-01-15', daysSince: 65 },
    { id: 'L010', name: 'Sarah Al-Falasi', source: 'Referral', type: 'Villa', status: 'Won', icp: 4, budget: '4.8M', location: 'Jumeirah, Dubai', next: 'Active — Villa Jumeirah', added: '2026-03-10', daysSince: 11, notes: 'FIRST DUBAI PROJECT' },
  ],

  // --- Projects ---
  projects: [
    { id: 'P001', name: 'Villa Al-Reem', client: 'Khalid Al-Mansouri', location: 'Reem Island, AD', phase: 'Concept', completion: 35, fee: 320000, paid: 96000, outstanding: 224000, overdue: 64000, activity: 'Concept sketches — 3 options', issues: 'Client slow on feedback; soil investigation needed' },
    { id: 'P002', name: 'Villa Saadiyat', client: 'Fatima Al-Hashimi', location: 'Saadiyat Island, AD', phase: 'Supervision', completion: 55, fee: 480000, paid: 336000, outstanding: 144000, overdue: 60000, activity: 'Structural — Column C7 rebar', issues: 'Contractor delay; Feb retainer unpaid' },
    { id: 'P003', name: 'Villa Yas', client: 'Mohammed Al-Ketbi', location: 'Yas Island, AD', phase: 'Municipality', completion: 70, fee: 280000, paid: 168000, outstanding: 112000, overdue: 56000, activity: 'Fire safety NOC — 2nd revision', issues: '2nd revision cycle; electrical NOC pending' },
    { id: 'P004', name: 'Townhouse Khalifa', client: 'Omar bin Rashid', location: 'Khalifa City, AD', phase: 'Proposal', completion: 5, fee: 180000, paid: 0, outstanding: 0, overdue: 0, activity: 'Contract negotiation', issues: 'Client wants scope reduction' },
    { id: 'P005', name: 'Villa Jumeirah', client: 'Sarah Al-Falasi', location: 'Jumeirah, Dubai', phase: 'Concept', completion: 10, fee: 250000, paid: 75000, outstanding: 175000, overdue: 0, activity: 'Initial concept brief', issues: 'First Dubai project — new process' },
  ],

  // --- Invoices ---
  invoices: [
    { id: 'INV-2026-008', project: 'Villa Al-Reem', amount: 64000, due: '2026-02-15', daysOverdue: 34 },
    { id: 'INV-2026-011', project: 'Villa Yas', amount: 56000, due: '2026-02-28', daysOverdue: 21 },
    { id: 'INV-2026-014', project: 'Villa Saadiyat', amount: 60000, due: '2026-03-01', daysOverdue: 20 },
  ],

  // --- Tasks ---
  tasks: [
    { title: 'Respond to Nasser Al-Suwaidi DM', priority: 'P0', due: 'TODAY', project: 'Lead', status: 'To Do', overdue: true, detail: '2 DAYS OVERDUE' },
    { title: 'Follow up INV-2026-008', priority: 'P0', due: 'TODAY', project: 'Villa Al-Reem', status: 'To Do', overdue: true, detail: 'AED 64K — 34 days' },
    { title: 'Follow up INV-2026-011', priority: 'P0', due: 'TODAY', project: 'Villa Yas', status: 'To Do', overdue: true, detail: 'AED 56K — 21 days' },
    { title: 'Follow up INV-2026-014', priority: 'P1', due: '2026-03-22', project: 'Villa Saadiyat', status: 'To Do', detail: 'AED 60K — 20 days' },
    { title: 'Send portfolio to Diana', priority: 'P1', due: '2026-03-22', project: 'Lead', status: 'To Do', detail: '6 days since contact' },
    { title: 'Commission soil investigation', priority: 'P1', due: '2026-04-01', project: 'Villa Al-Reem', status: 'To Do' },
    { title: 'Request title deed from Khalid', priority: 'P1', due: '2026-03-28', project: 'Villa Al-Reem', status: 'To Do' },
    { title: 'Update Estidama codes', priority: 'P1', due: '2026-04-01', project: 'Governance', status: 'To Do' },
    { title: 'Research Dubai Municipality', priority: 'P1', due: '2026-03-28', project: 'Villa Jumeirah', status: 'To Do' },
    { title: 'Qualify Rami Haddad', priority: 'P2', due: '2026-03-23', project: 'Lead', status: 'To Do', detail: 'ICP 2 — below threshold?' },
    { title: 'Train junior on supervision', priority: 'P2', due: '2026-04-15', project: 'Operations', status: 'To Do' },
    { title: 'Villa Al-Reem concept sketches', priority: 'P0', due: '2026-04-07', project: 'Villa Al-Reem', status: 'In Progress', detail: 'Client slow on feedback' },
    { title: 'Column C7 rebar verification', priority: 'P0', due: '2026-03-23', project: 'Villa Saadiyat', status: 'In Progress' },
    { title: 'Villa Yas fire safety NOC', priority: 'P0', due: '2026-03-25', project: 'Villa Yas', status: 'In Progress', detail: '2nd revision' },
    { title: 'Villa Jumeirah concept brief', priority: 'P1', due: '2026-04-10', project: 'Villa Jumeirah', status: 'In Progress' },
    { title: 'Townhouse Khalifa — negotiate', priority: 'P1', due: '2026-03-28', project: 'Townhouse Khalifa', status: 'In Progress' },
    { title: 'Ahmed meeting confirmation', priority: 'P1', project: 'Lead', status: 'Waiting', detail: '48h waiting' },
    { title: 'Khalid design feedback', priority: 'P0', project: 'Villa Al-Reem', status: 'Waiting', detail: '5 days waiting', overdue: true },
    { title: 'Villa Yas electrical NOC', priority: 'P1', project: 'Villa Yas', status: 'Waiting', detail: 'Submitted Mar 10' },
    { title: 'Hassan meeting — Mar 25', priority: 'P1', project: 'Lead', status: 'Waiting' },
  ],

  // --- Supervision ---
  supervision: [
    { date: '2026-03-21', project: 'Villa Saadiyat', category: 'Structural', finding: 'Column C7 rebar spacing 220mm (spec: 200mm)', severity: 'Major', action: 'Verify structural calc', deadline: '2026-03-23', status: 'Open' },
    { date: '2026-03-21', project: 'Villa Saadiyat', category: 'Structural', finding: 'Slab formwork — 3mm deflection', severity: 'Minor', action: 'Monitor during pour', deadline: '2026-03-22', status: 'Open' },
    { date: '2026-03-21', project: 'Villa Saadiyat', category: 'Structural', finding: 'Waterproofing membrane overlap — OK', severity: 'Observation', action: 'None', deadline: '—', status: 'Closed' },
    { date: '2026-03-18', project: 'Villa Saadiyat', category: 'Structural', finding: 'First floor column rebar — correct', severity: 'Observation', action: 'None', deadline: '—', status: 'Closed' },
    { date: '2026-03-10', project: 'Villa Yas', category: 'MEP', finding: 'Fire alarm conduit routing vs HVAC duct', severity: 'Major', action: 'MEP coordinator to resolve', deadline: '2026-03-17', status: 'In Progress' },
    { date: '2026-03-08', project: 'Villa Yas', category: 'Safety', finding: 'Missing fire extinguisher on 2nd floor', severity: 'Critical', action: 'Install immediately', deadline: '2026-03-09', status: 'Closed' },
  ],

  // --- Content ---
  content: [
    { week: 'W12', date: '2026-03-17', platform: 'Instagram', topic: 'Villa Saadiyat structural progress', lang: 'AR/EN', status: 'Missed', blocked: 'Waseem on site' },
    { week: 'W13', date: '2026-03-24', platform: 'Instagram', topic: 'Villa Al-Reem concept sketch teaser', lang: 'EN', status: 'Draft', blocked: 'Need client approval' },
    { week: 'W14', date: '2026-03-31', platform: 'Instagram', topic: 'Behind-the-scenes: site supervision day', lang: 'AR/EN', status: 'Planned', blocked: 'Junior to take photos' },
    { week: 'W15', date: '2026-04-07', platform: 'LinkedIn', topic: 'Municipality tips: avoid rejections', lang: 'EN', status: 'Planned', blocked: '' },
    { week: 'W16', date: '2026-04-14', platform: 'Instagram', topic: 'Material palette: AD villa finishes', lang: 'EN', status: 'Planned', blocked: '' },
    { week: 'W17', date: '2026-04-21', platform: 'Instagram', topic: 'Villa Jumeirah: first Dubai project', lang: 'AR/EN', status: 'Planned', blocked: "Need Sarah's approval" },
  ],

  // --- Google Sheets ---
  sheetsUrl: 'https://docs.google.com/spreadsheets/d/1tUOi9TsCRKXcELz1JK0WohKfeiDiQL3PQp0zvYLYmTk/edit?gid=1098074229#gid=1098074229',
  sheetsEmbedUrl: 'https://docs.google.com/spreadsheets/d/1tUOi9TsCRKXcELz1JK0WohKfeiDiQL3PQp0zvYLYmTk/htmlembed?gid=0',
};
