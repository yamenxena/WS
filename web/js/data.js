// Majaz AI OS — Sheets API Client + Fallback Data
// Fetches live data from Google Sheets via Apps Script Web App
// Falls back to static data if API is not configured

const CONFIG = {
  // PASTE YOUR APPS SCRIPT WEB APP URL HERE after deploying:
  API_URL: '',
  // Google Sheets direct link
  SHEETS_URL: 'https://docs.google.com/spreadsheets/d/1tUOi9TsCRKXcELz1JK0WohKfeiDiQL3PQp0zvYLYmTk/edit?gid=1098074229#gid=1098074229',
  SHEETS_EMBED: 'https://docs.google.com/spreadsheets/d/1tUOi9TsCRKXcELz1JK0WohKfeiDiQL3PQp0zvYLYmTk/htmlembed?gid=0',
  // Sheet tab names (must match exactly)
  SHEET_CRM: 'CRM Pipeline',
  SHEET_PROJECTS: 'Projects',
  SHEET_SUPERVISION: 'Supervision',
};

// --- API Client ---
const API = {
  isConfigured() {
    return CONFIG.API_URL && CONFIG.API_URL.length > 10;
  },

  async read(sheetName) {
    if (!this.isConfigured()) return null;
    try {
      const url = `${CONFIG.API_URL}?action=read&sheet=${encodeURIComponent(sheetName)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) { console.warn('API error:', data.error); return null; }
      return data;
    } catch (err) {
      console.warn('API fetch failed:', err);
      return null;
    }
  },

  async create(sheetName, rowData) {
    if (!this.isConfigured()) return { error: 'API not configured' };
    try {
      const url = `${CONFIG.API_URL}?action=create&sheet=${encodeURIComponent(sheetName)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rowData),
      });
      return await res.json();
    } catch (err) {
      return { error: err.message };
    }
  },

  async update(sheetName, rowNum, rowData) {
    if (!this.isConfigured()) return { error: 'API not configured' };
    try {
      const url = `${CONFIG.API_URL}?action=update&sheet=${encodeURIComponent(sheetName)}&row=${rowNum}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rowData),
      });
      return await res.json();
    } catch (err) {
      return { error: err.message };
    }
  },

  async remove(sheetName, rowNum) {
    if (!this.isConfigured()) return { error: 'API not configured' };
    try {
      const url = `${CONFIG.API_URL}?action=delete&sheet=${encodeURIComponent(sheetName)}&row=${rowNum}`;
      const res = await fetch(url, { method: 'POST' });
      return await res.json();
    } catch (err) {
      return { error: err.message };
    }
  }
};


// --- Dropdown Options ---
const OPTIONS = {
  status: ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'],
  icp: ['1', '2', '3', '4', '5'],
  type: ['Villa', 'Townhouse', 'Apartment', 'Commercial', 'Renovation', 'Other'],
  source: ['Instagram DM', 'Instagram/WhatsApp', 'WhatsApp', 'Referral', 'Direct', 'Website', 'LinkedIn', 'Other'],
  phase: ['Proposal', 'Concept', 'Working Drawings', 'Municipality', 'Construction', 'Supervision', 'Handover', 'Completed'],
  location: ['Reem Island AD', 'Saadiyat Island AD', 'Yas Island AD', 'Khalifa City AD', 'Al Shamkha AD', 'MBZ City AD', 'Al Raha AD', 'Jumeirah Dubai', 'Emirates Hills Dubai', 'Dubai Hills Dubai', 'Al Barsha Dubai', 'Other'],
  severity: ['Critical', 'Major', 'Minor', 'Observation'],
  category: ['Structural', 'MEP', 'Finishing', 'Landscape', 'Safety'],
  taskStatus: ['Open', 'In Progress', 'Closed'],
};


// --- Static Fallback Data (used when API not connected) ---
const STATIC_DATA = {
  leads: [
    { 'Lead ID':'L001','Client':'Nasser Al-Suwaidi','Source':'Instagram DM','Type':'Villa','Status':'New','ICP Score':4,'Budget (AED)':'3,500,000','Location':'Al Shamkha AD','Next Action':'Respond to DM — 2 DAYS OVERDUE','Date Added':'2026-03-19','Days Since Contact':2,'Notes':'⚠️ NO RESPONSE SENT' },
    { 'Lead ID':'L002','Client':'Layla Khoury','Source':'Referral','Type':'Villa','Status':'New','ICP Score':3,'Budget (AED)':'2,000,000','Location':'MBZ City AD','Next Action':'Initial call','Date Added':'2026-03-20','Days Since Contact':1,'Notes':'' },
    { 'Lead ID':'L003','Client':'Rami Haddad','Source':'Website','Type':'Villa','Status':'New','ICP Score':2,'Budget (AED)':'800,000','Location':'Al Ain','Next Action':'Qualify — below ICP?','Date Added':'2026-03-21','Days Since Contact':0,'Notes':'' },
    { 'Lead ID':'L004','Client':'Ahmed Al-Khatib','Source':'Instagram/WhatsApp','Type':'Villa','Status':'Contacted','ICP Score':5,'Budget (AED)':'4,500,000','Location':'Reem Island AD','Next Action':'Meeting confirmation — 48h','Date Added':'2026-03-18','Days Since Contact':3,'Notes':'⚠️ Waiting for reply' },
    { 'Lead ID':'L005','Client':'Diana Mostafa','Source':'Referral','Type':'Villa','Status':'Contacted','ICP Score':4,'Budget (AED)':'3,000,000','Location':'Saadiyat AD','Next Action':'Send portfolio','Date Added':'2026-03-15','Days Since Contact':6,'Notes':'⚠️ 6 days no follow-up' },
    { 'Lead ID':'L006','Client':'Hassan Al-Blooshi','Source':'Direct','Type':'Villa','Status':'Qualified','ICP Score':5,'Budget (AED)':'6,000,000','Location':'Saadiyat AD','Next Action':'Meeting Mar 25','Date Added':'2026-03-10','Days Since Contact':11,'Notes':'' },
    { 'Lead ID':'L007','Client':'Aisha bin Zayed','Source':'Instagram','Type':'Villa','Status':'Qualified','ICP Score':4,'Budget (AED)':'4,000,000','Location':'Yas Island AD','Next Action':'Send brief questionnaire','Date Added':'2026-03-12','Days Since Contact':9,'Notes':'' },
    { 'Lead ID':'L008','Client':'Omar bin Rashid','Source':'Referral','Type':'Townhouse','Status':'Proposal Sent','ICP Score':4,'Budget (AED)':'2,500,000','Location':'Khalifa City AD','Next Action':'Negotiate scope','Date Added':'2026-02-01','Days Since Contact':48,'Notes':'Stalled — wants scope reduction' },
    { 'Lead ID':'L009','Client':'Khalid Al-Mansouri','Source':'Direct','Type':'Villa','Status':'Won','ICP Score':5,'Budget (AED)':'5,200,000','Location':'Reem Island AD','Next Action':'Active — Villa Al-Reem','Date Added':'2026-01-15','Days Since Contact':65,'Notes':'' },
    { 'Lead ID':'L010','Client':'Sarah Al-Falasi','Source':'Referral','Type':'Villa','Status':'Won','ICP Score':4,'Budget (AED)':'4,800,000','Location':'Jumeirah Dubai','Next Action':'Active — Villa Jumeirah','Date Added':'2026-03-10','Days Since Contact':11,'Notes':'FIRST DUBAI PROJECT' },
  ],
  projects: [
    { 'Project ID':'P001','Name':'Villa Al-Reem','Client':'Khalid Al-Mansouri','Location':'Reem Island AD','Phase':'Concept','Completion %':'35%','Fee (AED)':'320,000','Paid (AED)':'96,000','Outstanding (AED)':'224,000','Overdue Amount':'64,000','Current Activity':'Concept sketches — 3 options','Issues':'Client slow on feedback' },
    { 'Project ID':'P002','Name':'Villa Saadiyat','Client':'Fatima Al-Hashimi','Location':'Saadiyat Island AD','Phase':'Supervision','Completion %':'55%','Fee (AED)':'480,000','Paid (AED)':'336,000','Outstanding (AED)':'144,000','Overdue Amount':'60,000','Current Activity':'Column C7 rebar verification','Issues':'Contractor delay' },
    { 'Project ID':'P003','Name':'Villa Yas','Client':'Mohammed Al-Ketbi','Location':'Yas Island AD','Phase':'Municipality','Completion %':'70%','Fee (AED)':'280,000','Paid (AED)':'168,000','Outstanding (AED)':'112,000','Overdue Amount':'56,000','Current Activity':'Fire safety NOC — 2nd revision','Issues':'Electrical NOC pending' },
    { 'Project ID':'P004','Name':'Townhouse Khalifa','Client':'Omar bin Rashid','Location':'Khalifa City AD','Phase':'Proposal','Completion %':'5%','Fee (AED)':'180,000','Paid (AED)':'0','Outstanding (AED)':'0','Overdue Amount':'0','Current Activity':'Contract negotiation','Issues':'Scope reduction' },
    { 'Project ID':'P005','Name':'Villa Jumeirah','Client':'Sarah Al-Falasi','Location':'Jumeirah Dubai','Phase':'Concept','Completion %':'10%','Fee (AED)':'250,000','Paid (AED)':'75,000','Outstanding (AED)':'175,000','Overdue Amount':'0','Current Activity':'Initial concept brief','Issues':'First Dubai project' },
  ],
  supervision: [
    { 'Date':'2026-03-21','Project':'Villa Saadiyat','Category':'Structural','Finding':'Column C7 rebar spacing 220mm (spec: 200mm)','Severity':'Major','Action Required':'Verify structural calc','Deadline':'2026-03-23','Status':'Open' },
    { 'Date':'2026-03-21','Project':'Villa Saadiyat','Category':'Structural','Finding':'Slab formwork — 3mm deflection','Severity':'Minor','Action Required':'Monitor during pour','Deadline':'2026-03-22','Status':'Open' },
    { 'Date':'2026-03-21','Project':'Villa Saadiyat','Category':'Structural','Finding':'Waterproofing membrane — OK','Severity':'Observation','Action Required':'None','Deadline':'—','Status':'Closed' },
    { 'Date':'2026-03-10','Project':'Villa Yas','Category':'MEP','Finding':'Fire alarm conduit vs HVAC duct','Severity':'Major','Action Required':'MEP coordinator to resolve','Deadline':'2026-03-17','Status':'In Progress' },
    { 'Date':'2026-03-08','Project':'Villa Yas','Category':'Safety','Finding':'Missing fire extinguisher 2nd floor','Severity':'Critical','Action Required':'Install immediately','Deadline':'2026-03-09','Status':'Closed' },
  ],
};


// --- Data Store (populated from API or static) ---
let STORE = {
  leads: [],
  projects: [],
  supervision: [],
  isLive: false,
};

async function loadData() {
  // Try live API first
  if (API.isConfigured()) {
    const [crm, proj, sup] = await Promise.all([
      API.read(CONFIG.SHEET_CRM),
      API.read(CONFIG.SHEET_PROJECTS),
      API.read(CONFIG.SHEET_SUPERVISION),
    ]);

    if (crm && crm.rows) {
      STORE.leads = crm.rows;
      STORE.projects = proj ? proj.rows : STATIC_DATA.projects;
      STORE.supervision = sup ? sup.rows : STATIC_DATA.supervision;
      STORE.isLive = true;
      return;
    }
  }

  // Fallback to static
  STORE.leads = STATIC_DATA.leads;
  STORE.projects = STATIC_DATA.projects;
  STORE.supervision = STATIC_DATA.supervision;
  STORE.isLive = false;
}
