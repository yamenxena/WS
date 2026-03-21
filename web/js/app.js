// Majaz AI OS — Dashboard App with CRUD
// Renders views, handles add/edit/delete via Google Sheets API

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('current-date').textContent = new Date().toISOString().split('T')[0];

  // Navigation
  document.querySelectorAll('.nav-item[data-view]').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.getElementById(`view-${item.dataset.view}`).classList.add('active');
    });
  });

  // Load data then render
  showLoading();
  await loadData();
  renderAll();
});

function showLoading() {
  document.getElementById('view-dashboard').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:60vh;flex-direction:column;gap:12px">
      <div style="font-size:32px">🏗️</div>
      <div style="color:var(--text-secondary)">Loading data...</div>
    </div>`;
}

function renderAll() {
  renderDashboard();
  renderCRM();
  renderProjects();
  renderTasks();
  renderSupervision();
  renderContent();

  // Show connection status
  const badge = document.getElementById('connection-badge');
  if (badge) {
    badge.textContent = STORE.isLive ? '🟢 LIVE' : '🟡 OFFLINE';
    badge.title = STORE.isLive ? 'Connected to Google Sheets' : 'Using static data — configure API_URL in data.js';
  }
}


// --- Helpers ---
function fmt(n) {
  if (typeof n === 'string') n = parseInt(n.replace(/[^0-9]/g, '')) || 0;
  return n.toLocaleString('en-AE');
}
function val(row, key) { return (row[key] !== undefined ? row[key] : '').toString(); }
function numVal(row, key) { return parseInt(val(row, key).replace(/[^0-9]/g, '')) || 0; }
function statusClass(s) { return 'status-' + s.toLowerCase().replace(/\s+/g, '').replace('sent',''); }
function phaseClass(p) { return 'phase-' + p.toLowerCase().replace(/\s+/g, ''); }
function sevClass(s) {
  if (s === 'Critical') return 'sev-critical';
  if (s === 'Major') return 'sev-major';
  if (s === 'Minor') return 'sev-minor';
  return 'sev-obs';
}


// --- Modal System ---
function showModal(title, contentHtml, onSave) {
  const existing = document.getElementById('modal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-backdrop" onclick="closeModal()"></div>
    <div class="modal">
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body">${contentHtml}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" id="modal-save">Save</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('modal-save').addEventListener('click', onSave);
}

function closeModal() {
  const m = document.getElementById('modal-overlay');
  if (m) m.remove();
}

function formField(label, name, value, type, options) {
  if (type === 'select') {
    const opts = options.map(o => `<option value="${o}" ${o == value ? 'selected' : ''}>${o}</option>`).join('');
    return `<div class="form-group"><label>${label}</label><select name="${name}" class="form-input">${opts}</select></div>`;
  }
  if (type === 'textarea') {
    return `<div class="form-group"><label>${label}</label><textarea name="${name}" class="form-input" rows="2">${value || ''}</textarea></div>`;
  }
  return `<div class="form-group"><label>${label}</label><input type="${type || 'text'}" name="${name}" value="${value || ''}" class="form-input" /></div>`;
}

function getFormData() {
  const data = {};
  document.querySelectorAll('.modal .form-input').forEach(el => {
    data[el.name] = el.value;
  });
  return data;
}

async function showStatus(msg, isError) {
  const el = document.createElement('div');
  el.className = `toast ${isError ? 'toast-error' : 'toast-success'}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}


// ========================
// DASHBOARD VIEW
// ========================
function renderDashboard() {
  const el = document.getElementById('view-dashboard');
  const leads = STORE.leads;
  const projects = STORE.projects;
  const totalFees = projects.reduce((s, p) => s + numVal(p, 'Fee (AED)'), 0);
  const totalPaid = projects.reduce((s, p) => s + numVal(p, 'Paid (AED)'), 0);
  const totalOverdue = projects.reduce((s, p) => s + numVal(p, 'Overdue Amount'), 0);
  const activeLeads = leads.filter(l => !['Won','Lost'].includes(val(l,'Status'))).length;
  const overdueLeads = leads.filter(l => val(l,'Notes').includes('⚠️')).length;

  el.innerHTML = `
    <div class="page-header" style="display:flex;align-items:center;justify-content:space-between">
      <div>
        <h1>Dashboard</h1>
        <p>Majaz Engineering Consultancy — AI OS Overview</p>
      </div>
      <span id="connection-badge" class="status" style="font-size:12px;cursor:help">${STORE.isLive ? '🟢 LIVE' : '🟡 OFFLINE'}</span>
    </div>

    ${overdueLeads > 0 ? `
    <div class="alert-banner">
      <span class="alert-icon">🚨</span>
      <span class="alert-text"><strong>${overdueLeads} leads with overdue responses</strong></span>
    </div>` : ''}

    ${totalOverdue > 0 ? `
    <div class="alert-banner">
      <span class="alert-icon">💰</span>
      <span class="alert-text"><strong>AED ${fmt(totalOverdue)} in overdue invoices</strong></span>
    </div>` : ''}

    <div class="metrics-grid">
      <div class="metric-card"><div class="metric-label">Active Projects</div><div class="metric-value gold">${projects.length}</div></div>
      <div class="metric-card"><div class="metric-label">Pipeline Leads</div><div class="metric-value ${overdueLeads > 0 ? 'warning' : 'success'}">${activeLeads}</div></div>
      <div class="metric-card"><div class="metric-label">Total Fees</div><div class="metric-value gold">AED ${fmt(totalFees)}</div></div>
      <div class="metric-card"><div class="metric-label">Overdue</div><div class="metric-value danger">AED ${fmt(totalOverdue)}</div></div>
    </div>

    <div class="section-header">
      <span class="section-title">📗 Google Sheets</span>
      <a class="section-link" href="${CONFIG.SHEETS_URL}" target="_blank">Open in Sheets ↗</a>
    </div>
    <div class="sheets-embed"><iframe src="${CONFIG.SHEETS_EMBED}" loading="lazy"></iframe></div>
  `;
}


// ========================
// CRM KANBAN + CRUD
// ========================
function renderCRM() {
  const el = document.getElementById('view-crm');
  const leads = STORE.leads;
  const stages = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];

  const lanes = stages.map(stage => {
    const items = leads.filter(l => val(l,'Status') === stage);
    const cards = items.map((l, i) => {
      const isOverdue = val(l,'Notes').includes('⚠️');
      const icp = numVal(l, 'ICP Score') || val(l, 'ICP Score');
      return `
      <div class="kanban-card ${isOverdue ? 'overdue' : ''}" onclick="editLead(${leads.indexOf(l)})">
        <div class="kanban-card-title">
          <span class="icp icp-${icp}">${icp}</span> ${val(l,'Client')}
        </div>
        <div class="kanban-card-meta">
          <span>💰 AED ${val(l,'Budget (AED)')} · ${val(l,'Location')}</span>
          <span>📍 ${val(l,'Source')} · ${val(l,'Type')}</span>
          <span>➡️ ${val(l,'Next Action')}</span>
          ${val(l,'Notes') ? `<span style="color:var(--orange);margin-top:4px">${val(l,'Notes')}</span>` : ''}
        </div>
      </div>`;
    }).join('');

    return `
      <div class="kanban-lane">
        <div class="kanban-lane-header">
          <span class="kanban-lane-title">${stage}</span>
          <span class="kanban-lane-count">${items.length}</span>
        </div>
        <div class="kanban-lane-body">
          ${cards || ''}
          <div class="kanban-add-card" onclick="addLeadToStage('${stage}')">
            <span>+ Add card</span>
          </div>
        </div>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="page-header">
      <h1>CRM Pipeline</h1>
      <p>${leads.length} leads · Click a card to edit</p>
    </div>
    <div class="kanban-board">${lanes}</div>
  `;
}

// Add Lead Modal (from lane + button)
function addLeadToStage(stage) {
  addLead(stage);
}

function addLead(defaultStatus) {
  const html = `<div class="form-grid">
    ${formField('Client Name', 'Client', '', 'text')}
    ${formField('Source', 'Source', '', 'select', OPTIONS.source)}
    ${formField('Type', 'Type', 'Villa', 'select', OPTIONS.type)}
    ${formField('Status', 'Status', defaultStatus || 'New', 'select', OPTIONS.status)}
    ${formField('ICP Score', 'ICP Score', '3', 'select', OPTIONS.icp)}
    ${formField('Budget (AED)', 'Budget (AED)', '', 'text')}
    ${formField('Location', 'Location', '', 'select', OPTIONS.location)}
    ${formField('Next Action', 'Next Action', '', 'text')}
    ${formField('Notes', 'Notes', '', 'textarea')}
  </div>`;

  showModal('Add New Lead', html, async () => {
    const data = getFormData();
    data['Lead ID'] = 'L' + String(STORE.leads.length + 1).padStart(3, '0');
    data['Date Added'] = new Date().toISOString().split('T')[0];
    data['Days Since Contact'] = '0';

    if (API.isConfigured()) {
      const result = await API.create(CONFIG.SHEET_CRM, data);
      if (result.error) { showStatus('Error: ' + result.error, true); return; }
      showStatus('✅ Lead added to Google Sheets');
    }

    STORE.leads.push(data);
    closeModal();
    renderCRM();
    renderDashboard();
  });
}

// Edit Lead Modal
function editLead(idx) {
  const lead = STORE.leads[idx];
  const html = `<div class="form-grid">
    ${formField('Client Name', 'Client', val(lead,'Client'), 'text')}
    ${formField('Source', 'Source', val(lead,'Source'), 'select', OPTIONS.source)}
    ${formField('Type', 'Type', val(lead,'Type'), 'select', OPTIONS.type)}
    ${formField('Status', 'Status', val(lead,'Status'), 'select', OPTIONS.status)}
    ${formField('ICP Score', 'ICP Score', val(lead,'ICP Score'), 'select', OPTIONS.icp)}
    ${formField('Budget (AED)', 'Budget (AED)', val(lead,'Budget (AED)'), 'text')}
    ${formField('Location', 'Location', val(lead,'Location'), 'select', OPTIONS.location)}
    ${formField('Next Action', 'Next Action', val(lead,'Next Action'), 'text')}
    ${formField('Notes', 'Notes', val(lead,'Notes'), 'textarea')}
  </div>`;

  showModal('Edit Lead — ' + val(lead,'Client'), html, async () => {
    const data = getFormData();
    data['Lead ID'] = val(lead, 'Lead ID');
    data['Date Added'] = val(lead, 'Date Added');
    data['Days Since Contact'] = val(lead, 'Days Since Contact');

    if (API.isConfigured() && lead._row) {
      const result = await API.update(CONFIG.SHEET_CRM, lead._row, data);
      if (result.error) { showStatus('Error: ' + result.error, true); return; }
      showStatus('✅ Lead updated in Google Sheets');
    }

    Object.assign(STORE.leads[idx], data);
    closeModal();
    renderCRM();
    renderDashboard();
  });

  // Add delete button
  const footer = document.querySelector('.modal-footer');
  const delBtn = document.createElement('button');
  delBtn.className = 'btn btn-danger';
  delBtn.textContent = 'Delete';
  delBtn.style.marginRight = 'auto';
  delBtn.onclick = async () => {
    if (!confirm('Delete lead ' + val(lead,'Client') + '?')) return;
    if (API.isConfigured() && lead._row) {
      await API.remove(CONFIG.SHEET_CRM, lead._row);
      showStatus('Lead deleted from Google Sheets');
    }
    STORE.leads.splice(idx, 1);
    closeModal();
    renderCRM();
    renderDashboard();
  };
  footer.insertBefore(delBtn, footer.firstChild);
}


// ========================
// PROJECTS VIEW + CRUD
// ========================
function renderProjects() {
  const el = document.getElementById('view-projects');
  const projects = STORE.projects;
  const totalOverdue = projects.reduce((s, p) => s + numVal(p, 'Overdue Amount'), 0);

  el.innerHTML = `
    <div class="page-header" style="display:flex;align-items:center;justify-content:space-between">
      <div>
        <h1>Active Projects</h1>
        <p>${projects.length} projects · AED ${fmt(totalOverdue)} overdue</p>
      </div>
      <button class="btn btn-primary" onclick="addProject()">+ Add Project</button>
    </div>
    <div class="table-container"><table>
      <thead><tr><th>Project</th><th>Client</th><th>Location</th><th>Phase</th><th>Done</th><th>Fee</th><th>Overdue</th><th>Issues</th><th></th></tr></thead>
      <tbody>${projects.map((p, i) => {
        const comp = parseInt(val(p,'Completion %')) || 0;
        const overdue = numVal(p, 'Overdue Amount');
        return `<tr>
          <td style="font-weight:600">${val(p,'Name')}</td>
          <td>${val(p,'Client')}</td>
          <td>${val(p,'Location')}</td>
          <td><span class="status ${phaseClass(val(p,'Phase'))}">${val(p,'Phase')}</span></td>
          <td><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;height:6px;background:var(--bg-light);border-radius:3px;overflow:hidden"><div style="width:${comp}%;height:100%;background:var(--gold);border-radius:3px"></div></div><span style="font-size:11px;color:var(--text-secondary)">${comp}%</span></div></td>
          <td>AED ${val(p,'Fee (AED)')}</td>
          <td style="color:${overdue > 0 ? 'var(--red);font-weight:700' : 'var(--text-faint)'}">${overdue > 0 ? 'AED ' + fmt(overdue) : '—'}</td>
          <td style="font-size:12px;color:var(--text-secondary);max-width:180px">${val(p,'Issues')}</td>
          <td><button class="btn-icon" onclick="editProject(${i})" title="Edit">✏️</button></td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>

    <div class="metrics-grid">
      <div class="metric-card"><div class="metric-label">Total Fees</div><div class="metric-value gold">AED ${fmt(projects.reduce((s,p)=>s+numVal(p,'Fee (AED)'),0))}</div></div>
      <div class="metric-card"><div class="metric-label">Received</div><div class="metric-value success">AED ${fmt(projects.reduce((s,p)=>s+numVal(p,'Paid (AED)'),0))}</div></div>
      <div class="metric-card"><div class="metric-label">Outstanding</div><div class="metric-value warning">AED ${fmt(projects.reduce((s,p)=>s+numVal(p,'Outstanding (AED)'),0))}</div></div>
      <div class="metric-card"><div class="metric-label">Overdue</div><div class="metric-value danger">AED ${fmt(totalOverdue)}</div></div>
    </div>
  `;
}

function addProject() {
  const html = `<div class="form-grid">
    ${formField('Project Name', 'Name', '', 'text')}
    ${formField('Client', 'Client', '', 'text')}
    ${formField('Location', 'Location', '', 'select', OPTIONS.location)}
    ${formField('Phase', 'Phase', 'Concept', 'select', OPTIONS.phase)}
    ${formField('Fee (AED)', 'Fee (AED)', '', 'text')}
    ${formField('Current Activity', 'Current Activity', '', 'text')}
    ${formField('Issues', 'Issues', '', 'textarea')}
  </div>`;
  showModal('Add New Project', html, async () => {
    const data = getFormData();
    data['Project ID'] = 'P' + String(STORE.projects.length + 1).padStart(3, '0');
    data['Completion %'] = '0%';
    data['Paid (AED)'] = '0';
    data['Outstanding (AED)'] = '0';
    data['Overdue Amount'] = '0';
    if (API.isConfigured()) {
      const r = await API.create(CONFIG.SHEET_PROJECTS, data);
      if (r.error) { showStatus('Error: ' + r.error, true); return; }
      showStatus('✅ Project added');
    }
    STORE.projects.push(data);
    closeModal(); renderProjects(); renderDashboard();
  });
}

function editProject(idx) {
  const p = STORE.projects[idx];
  const html = `<div class="form-grid">
    ${formField('Project Name', 'Name', val(p,'Name'), 'text')}
    ${formField('Client', 'Client', val(p,'Client'), 'text')}
    ${formField('Location', 'Location', val(p,'Location'), 'select', OPTIONS.location)}
    ${formField('Phase', 'Phase', val(p,'Phase'), 'select', OPTIONS.phase)}
    ${formField('Completion %', 'Completion %', val(p,'Completion %'), 'text')}
    ${formField('Fee (AED)', 'Fee (AED)', val(p,'Fee (AED)'), 'text')}
    ${formField('Paid (AED)', 'Paid (AED)', val(p,'Paid (AED)'), 'text')}
    ${formField('Outstanding (AED)', 'Outstanding (AED)', val(p,'Outstanding (AED)'), 'text')}
    ${formField('Overdue Amount', 'Overdue Amount', val(p,'Overdue Amount'), 'text')}
    ${formField('Current Activity', 'Current Activity', val(p,'Current Activity'), 'text')}
    ${formField('Issues', 'Issues', val(p,'Issues'), 'textarea')}
  </div>`;
  showModal('Edit Project — ' + val(p,'Name'), html, async () => {
    const data = getFormData();
    data['Project ID'] = val(p, 'Project ID');
    if (API.isConfigured() && p._row) {
      const r = await API.update(CONFIG.SHEET_PROJECTS, p._row, data);
      if (r.error) { showStatus('Error: ' + r.error, true); return; }
      showStatus('✅ Project updated');
    }
    Object.assign(STORE.projects[idx], data);
    closeModal(); renderProjects(); renderDashboard();
  });
}


// ========================
// TASKS VIEW — Kanban (matching Obsidian)
// ========================
function renderTasks() {
  const el = document.getElementById('view-tasks');
  // Build tasks from project + lead data
  if (!STORE.tasks) STORE.tasks = [];
  if (STORE.tasks.length === 0) {
    STORE.leads.filter(l => val(l,'Notes').includes('⚠️')).forEach(l => {
      STORE.tasks.push({ title: 'Respond: ' + val(l,'Client'), priority: 'P0', project: 'Lead', status: 'To Do', overdue: true, detail: val(l,'Notes') });
    });
    STORE.projects.filter(p => numVal(p,'Overdue Amount') > 0).forEach(p => {
      STORE.tasks.push({ title: 'Follow up invoice — ' + val(p,'Name'), priority: 'P0', project: val(p,'Name'), status: 'To Do', overdue: true, detail: 'AED ' + val(p,'Overdue Amount') + ' overdue' });
    });
    STORE.projects.forEach(p => {
      STORE.tasks.push({ title: val(p,'Current Activity'), priority: val(p,'Phase')==='Concept'?'P0':'P1', project: val(p,'Name'), status: 'In Progress', detail: val(p,'Issues') });
    });
  }

  const columns = ['To Do', 'In Progress', 'Waiting', 'Done'];

  const lanes = columns.map(col => {
    const items = STORE.tasks.filter(t => t.status === col);
    const cards = items.map((t, i) => {
      const idx = STORE.tasks.indexOf(t);
      return `
      <div class="kanban-card ${t.overdue ? 'overdue' : ''}" onclick="editTask(${idx})">
        <div class="kanban-card-title">
          <span class="priority-${t.priority.toLowerCase()}" style="margin-right:6px">${t.priority}</span> ${t.title}
        </div>
        <div class="kanban-card-meta">
          <span>📁 ${t.project}</span>
          ${t.detail ? `<span style="color:${t.overdue ? 'var(--red)' : 'var(--text-secondary)'}">${t.detail}</span>` : ''}
        </div>
      </div>`;
    }).join('');

    return `
      <div class="kanban-lane">
        <div class="kanban-lane-header">
          <span class="kanban-lane-title">${col}</span>
          <span class="kanban-lane-count">${items.length}</span>
        </div>
        <div class="kanban-lane-body">
          ${cards || ''}
          <div class="kanban-add-card" onclick="addTask('${col}')">
            <span>+ Add card</span>
          </div>
        </div>
      </div>`;
  }).join('');

  const overdueCount = STORE.tasks.filter(t => t.overdue).length;

  el.innerHTML = `
    <div class="page-header">
      <h1>Task Board</h1>
      <p>${STORE.tasks.length} tasks · ${overdueCount} overdue</p>
    </div>
    ${overdueCount > 0 ? `<div class="alert-banner"><span class="alert-icon">🔴</span><span class="alert-text"><strong>${overdueCount} overdue items need action TODAY</strong></span></div>` : ''}
    <div class="kanban-board">${lanes}</div>
  `;
}

function addTask(defaultStatus) {
  const projectNames = ['Lead', 'Operations', 'Governance', ...STORE.projects.map(p => val(p,'Name'))];
  const html = `<div class="form-grid">
    ${formField('Task Title', 'title', '', 'text')}
    ${formField('Priority', 'priority', 'P1', 'select', ['P0', 'P1', 'P2'])}
    ${formField('Project', 'project', '', 'select', projectNames)}
    ${formField('Status', 'status', defaultStatus || 'To Do', 'select', ['To Do', 'In Progress', 'Waiting', 'Done'])}
    ${formField('Detail', 'detail', '', 'textarea')}
  </div>`;
  showModal('Add Task', html, () => {
    const data = getFormData();
    STORE.tasks.push(data);
    closeModal();
    renderTasks();
  });
}

function editTask(idx) {
  const t = STORE.tasks[idx];
  const projectNames = ['Lead', 'Operations', 'Governance', ...STORE.projects.map(p => val(p,'Name'))];
  const html = `<div class="form-grid">
    ${formField('Task Title', 'title', t.title || '', 'text')}
    ${formField('Priority', 'priority', t.priority || 'P1', 'select', ['P0', 'P1', 'P2'])}
    ${formField('Project', 'project', t.project || '', 'select', projectNames)}
    ${formField('Status', 'status', t.status || 'To Do', 'select', ['To Do', 'In Progress', 'Waiting', 'Done'])}
    ${formField('Detail', 'detail', t.detail || '', 'textarea')}
  </div>`;
  showModal('Edit Task', html, () => {
    const data = getFormData();
    Object.assign(STORE.tasks[idx], data);
    closeModal();
    renderTasks();
  });
  // Delete button
  const footer = document.querySelector('.modal-footer');
  const delBtn = document.createElement('button');
  delBtn.className = 'btn btn-danger';
  delBtn.textContent = 'Delete';
  delBtn.style.marginRight = 'auto';
  delBtn.onclick = () => { STORE.tasks.splice(idx, 1); closeModal(); renderTasks(); };
  footer.insertBefore(delBtn, footer.firstChild);
}


// ========================
// SUPERVISION VIEW + CRUD
// ========================
function renderSupervision() {
  const el = document.getElementById('view-supervision');
  const items = STORE.supervision;

  el.innerHTML = `
    <div class="page-header" style="display:flex;align-items:center;justify-content:space-between">
      <div><h1>Supervision Log</h1><p>${items.length} entries · ${items.filter(s=>val(s,'Status')!=='Closed').length} open</p></div>
      <button class="btn btn-primary" onclick="addSupervision()">+ Add Finding</button>
    </div>
    <div class="table-container"><table>
      <thead><tr><th>Date</th><th>Project</th><th>Category</th><th>Finding</th><th>Severity</th><th>Action</th><th>Status</th><th></th></tr></thead>
      <tbody>${items.map((s, i) => `<tr>
        <td style="white-space:nowrap">${val(s,'Date')}</td>
        <td style="font-weight:500">${val(s,'Project')}</td>
        <td>${val(s,'Category')}</td>
        <td style="max-width:220px">${val(s,'Finding')}</td>
        <td><span class="status ${sevClass(val(s,'Severity'))}">${val(s,'Severity')}</span></td>
        <td style="font-size:12px">${val(s,'Action Required')}</td>
        <td><span class="status ${val(s,'Status')==='Open'?'status-open':val(s,'Status')==='In Progress'?'status-progress':'status-closed'}">${val(s,'Status')}</span></td>
        <td><button class="btn-icon" onclick="editSupervision(${i})" title="Edit">✏️</button></td>
      </tr>`).join('')}</tbody>
    </table></div>
  `;
}

function addSupervision() {
  const projectNames = STORE.projects.map(p => val(p,'Name'));
  const html = `<div class="form-grid">
    ${formField('Date', 'Date', new Date().toISOString().split('T')[0], 'date')}
    ${formField('Project', 'Project', '', 'select', projectNames)}
    ${formField('Category', 'Category', '', 'select', OPTIONS.category)}
    ${formField('Finding', 'Finding', '', 'textarea')}
    ${formField('Severity', 'Severity', 'Minor', 'select', OPTIONS.severity)}
    ${formField('Action Required', 'Action Required', '', 'text')}
    ${formField('Deadline', 'Deadline', '', 'date')}
    ${formField('Status', 'Status', 'Open', 'select', OPTIONS.taskStatus)}
  </div>`;
  showModal('Add Supervision Finding', html, async () => {
    const data = getFormData();
    if (API.isConfigured()) {
      const r = await API.create(CONFIG.SHEET_SUPERVISION, data);
      if (r.error) { showStatus('Error: ' + r.error, true); return; }
      showStatus('✅ Finding added');
    }
    STORE.supervision.unshift(data);
    closeModal(); renderSupervision();
  });
}

function editSupervision(idx) {
  const s = STORE.supervision[idx];
  const projectNames = STORE.projects.map(p => val(p,'Name'));
  const html = `<div class="form-grid">
    ${formField('Date', 'Date', val(s,'Date'), 'date')}
    ${formField('Project', 'Project', val(s,'Project'), 'select', projectNames)}
    ${formField('Category', 'Category', val(s,'Category'), 'select', OPTIONS.category)}
    ${formField('Finding', 'Finding', val(s,'Finding'), 'textarea')}
    ${formField('Severity', 'Severity', val(s,'Severity'), 'select', OPTIONS.severity)}
    ${formField('Action Required', 'Action Required', val(s,'Action Required'), 'text')}
    ${formField('Deadline', 'Deadline', val(s,'Deadline'), 'date')}
    ${formField('Status', 'Status', val(s,'Status'), 'select', OPTIONS.taskStatus)}
  </div>`;
  showModal('Edit Finding', html, async () => {
    const data = getFormData();
    if (API.isConfigured() && s._row) {
      const r = await API.update(CONFIG.SHEET_SUPERVISION, s._row, data);
      if (r.error) { showStatus('Error: ' + r.error, true); return; }
      showStatus('✅ Finding updated');
    }
    Object.assign(STORE.supervision[idx], data);
    closeModal(); renderSupervision();
  });
}


// ========================
// CONTENT VIEW
// ========================
function renderContent() {
  const el = document.getElementById('view-content');
  const content = [
    { week:'W12', date:'2026-03-17', platform:'Instagram', topic:'Villa Saadiyat structural progress', status:'Missed', blocked:'Waseem on site' },
    { week:'W13', date:'2026-03-24', platform:'Instagram', topic:'Villa Al-Reem concept sketch teaser', status:'Draft', blocked:'Need client approval' },
    { week:'W14', date:'2026-03-31', platform:'Instagram', topic:'Behind-the-scenes: site supervision', status:'Planned', blocked:'' },
    { week:'W15', date:'2026-04-07', platform:'LinkedIn', topic:'Municipality tips: avoid rejections', status:'Planned', blocked:'' },
    { week:'W16', date:'2026-04-14', platform:'Instagram', topic:'Material palette: AD villa finishes', status:'Planned', blocked:'' },
    { week:'W17', date:'2026-04-21', platform:'Instagram', topic:'Villa Jumeirah: first Dubai project', status:'Planned', blocked:"Need Sarah's approval" },
  ];

  el.innerHTML = `
    <div class="page-header"><h1>Content Pipeline</h1><p>March: 0/3 published · Behind schedule</p></div>
    <div class="alert-banner warning"><span class="alert-icon">📱</span><span class="alert-text"><strong>0 / 3 March posts.</strong> Waseem bottleneck — delegate: agent drafts, junior takes photos.</span></div>
    <div class="table-container"><table>
      <thead><tr><th>Week</th><th>Date</th><th>Platform</th><th>Topic</th><th>Status</th><th>Blocked By</th></tr></thead>
      <tbody>${content.map(c => `<tr>
        <td style="font-weight:600;color:var(--text-faint)">${c.week}</td>
        <td style="white-space:nowrap">${c.date}</td><td>${c.platform}</td><td>${c.topic}</td>
        <td><span class="status ${c.status==='Missed'?'sev-critical':c.status==='Draft'?'status-open':'status-progress'}">${c.status}</span></td>
        <td style="font-size:12px;color:var(--text-secondary)">${c.blocked||'—'}</td>
      </tr>`).join('')}</tbody></table></div>
  `;
}
