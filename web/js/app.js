// Majaz AI OS — Dashboard App with CRUD
// Renders views, handles add/edit/delete via Google Sheets API

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('current-date').textContent = new Date().toISOString().split('T')[0];

  // --- Mobile Sidebar Toggle ---
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('open');
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  }

  hamburger.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });

  overlay.addEventListener('click', closeSidebar);

  // --- Navigation (top navbar tabs) ---
  document.querySelectorAll('.navbar-tab[data-view]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.navbar-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.getElementById(`view-${tab.dataset.view}`).classList.add('active');
      closeSidebar();
    });
  });

  // --- Sidebar Action Buttons → Side Panels ---
  document.querySelectorAll('.sidebar-btn[data-panel]').forEach(btn => {
    btn.addEventListener('click', () => {
      const panelId = `panel-${btn.dataset.panel}`;
      const panel = document.getElementById(panelId);
      const wasOpen = panel.classList.contains('open');

      // Close all panels first
      document.querySelectorAll('.side-panel').forEach(p => p.classList.remove('open'));
      document.querySelectorAll('.sidebar-btn[data-panel]').forEach(b => b.classList.remove('active'));

      if (!wasOpen) {
        panel.classList.add('open');
        btn.classList.add('active');
        renderPanel(btn.dataset.panel);
      }
      closeSidebar();
    });
  });

  // Close panel buttons
  document.querySelectorAll('[data-close-panel]').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.side-panel').classList.remove('open');
      document.querySelectorAll('.sidebar-btn[data-panel]').forEach(b => b.classList.remove('active'));
    });
  });

  // Logout button
  document.getElementById('btn-logout').addEventListener('click', () => {
    if (confirm('Logout from Majaz AI OS?')) {
      window.location.reload();
    }
  });

  // --- Global Search ---
  const searchInput = document.getElementById('global-search');
  const searchResults = document.getElementById('search-results');

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    if (q.length < 2) {
      searchResults.classList.remove('open');
      searchResults.innerHTML = '';
      return;
    }
    const results = searchAll(q);
    if (results.length === 0) {
      searchResults.innerHTML = '<div class="search-no-results">No results for "' + searchInput.value + '"</div>';
    } else {
      searchResults.innerHTML = results.map(r => `
        <div class="search-result-item" data-goto-view="${r.view}" data-goto-idx="${r.idx}">
          <span class="search-result-type ${r.typeClass}">${r.type}</span>
          <span class="search-result-title">${highlightMatch(r.title, q)}</span>
          <span class="search-result-detail">${r.detail}</span>
        </div>
      `).join('');

      // Click to navigate
      searchResults.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const view = item.dataset.gotoView;
          // Activate that view
          document.querySelectorAll('.navbar-tab').forEach(t => t.classList.remove('active'));
          const targetTab = document.querySelector(`.navbar-tab[data-view="${view}"]`);
          if (targetTab) targetTab.classList.add('active');
          document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
          document.getElementById(`view-${view}`).classList.add('active');
          searchResults.classList.remove('open');
          searchInput.value = '';
        });
      });
    }
    searchResults.classList.add('open');
  });

  // Escape key: clear search, close panels
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSidebar();
      searchResults.classList.remove('open');
      searchInput.value = '';
      searchInput.blur();
      document.querySelectorAll('.side-panel').forEach(p => p.classList.remove('open'));
      document.querySelectorAll('.sidebar-btn[data-panel]').forEach(b => b.classList.remove('active'));
    }
  });

  // Close search when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar-search') && !e.target.closest('.search-results')) {
      searchResults.classList.remove('open');
    }
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

// --- Global Search ---
function searchAll(query) {
  const results = [];
  const q = query.toLowerCase();

  // Search leads
  STORE.leads.forEach((l, i) => {
    const text = Object.values(l).join(' ').toLowerCase();
    if (text.includes(q)) {
      results.push({
        type: 'Lead', typeClass: 'type-lead', view: 'crm', idx: i,
        title: val(l, 'Client') || val(l, 'Lead ID'),
        detail: val(l, 'Status') + ' · ' + val(l, 'Location'),
      });
    }
  });

  // Search projects
  STORE.projects.forEach((p, i) => {
    const text = Object.values(p).join(' ').toLowerCase();
    if (text.includes(q)) {
      results.push({
        type: 'Project', typeClass: 'type-project', view: 'projects', idx: i,
        title: val(p, 'Name') || val(p, 'Project ID'),
        detail: val(p, 'Phase') + ' · ' + val(p, 'Client'),
      });
    }
  });

  // Search tasks
  if (STORE.tasks) {
    STORE.tasks.forEach((t, i) => {
      const text = Object.values(t).join(' ').toLowerCase();
      if (text.includes(q)) {
        results.push({
          type: 'Task', typeClass: 'type-task', view: 'tasks', idx: i,
          title: t.title || 'Task',
          detail: (t.priority || '') + ' · ' + (t.project || ''),
        });
      }
    });
  }

  // Search supervision
  STORE.supervision.forEach((s, i) => {
    const text = Object.values(s).join(' ').toLowerCase();
    if (text.includes(q)) {
      results.push({
        type: 'Finding', typeClass: 'type-finding', view: 'supervision', idx: i,
        title: val(s, 'Finding') || val(s, 'Category'),
        detail: val(s, 'Severity') + ' · ' + val(s, 'Project'),
      });
    }
  });

  return results.slice(0, 20); // cap at 20
}

function highlightMatch(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark style="background:var(--gold-dim);color:var(--gold);border-radius:2px;padding:0 2px">$1</mark>');
}

// --- Side Panel Content Renderers ---
function renderPanel(panelName) {
  if (panelName === 'filters') renderFiltersPanel();
  else if (panelName === 'flow') renderFlowPanel();
  else if (panelName === 'timeline') renderTimelinePanel();
}

function renderFiltersPanel() {
  const body = document.getElementById('filters-body');
  const statuses = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];
  const phases = ['Proposal', 'Concept', 'Working Drawings', 'Municipality', 'Construction', 'Supervision', 'Handover', 'Completed'];
  const sevs = ['Critical', 'Major', 'Minor', 'Observation'];
  const sources = ['Instagram DM', 'Instagram/WhatsApp', 'WhatsApp', 'Referral', 'Direct', 'Website', 'LinkedIn'];

  body.innerHTML = `
    <div class="panel-section">
      <div class="panel-section-title">Lead Status</div>
      ${statuses.map(s => {
        const count = STORE.leads.filter(l => val(l, 'Status') === s).length;
        return `<span class="panel-pill" data-filter="status:${s}">${s} (${count})</span>`;
      }).join('')}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Project Phase</div>
      ${phases.map(p => {
        const count = STORE.projects.filter(pr => val(pr, 'Phase') === p).length;
        return `<span class="panel-pill" data-filter="phase:${p}">${p} (${count})</span>`;
      }).join('')}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Severity</div>
      ${sevs.map(s => {
        const count = STORE.supervision.filter(sv => val(sv, 'Severity') === s).length;
        return `<span class="panel-pill" data-filter="severity:${s}">${s} (${count})</span>`;
      }).join('')}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Lead Source</div>
      ${sources.map(s => {
        const count = STORE.leads.filter(l => val(l, 'Source') === s).length;
        return count > 0 ? `<span class="panel-pill" data-filter="source:${s}">${s} (${count})</span>` : '';
      }).join('')}
    </div>
  `;

  // Pill click → navigate + filter search
  body.querySelectorAll('.panel-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      pill.classList.toggle('active');
      const filter = pill.dataset.filter;
      const [type, value] = filter.split(':');
      const searchInput = document.getElementById('global-search');
      searchInput.value = value;
      searchInput.dispatchEvent(new Event('input'));
    });
  });
}

function renderFlowPanel() {
  const body = document.getElementById('flow-body');
  const stages = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];
  const total = STORE.leads.length || 1;

  let html = '<div class="panel-section"><div class="panel-section-title">CRM Pipeline Flow</div>';
  stages.forEach((stage, i) => {
    const count = STORE.leads.filter(l => val(l, 'Status') === stage).length;
    const pct = Math.round((count / total) * 100);
    html += `
      <div class="flow-stage">
        <span class="flow-count">${count}</span>
        <span class="flow-label">${stage}</span>
        <div class="flow-bar"><div class="flow-bar-fill" style="width:${pct}%"></div></div>
      </div>`;
    if (i < stages.length - 1) html += '<div class="flow-arrow">↓</div>';
  });
  html += '</div>';

  // Project phases
  const phases = ['Proposal', 'Concept', 'Working Drawings', 'Municipality', 'Construction', 'Supervision', 'Handover', 'Completed'];
  const totalP = STORE.projects.length || 1;
  html += '<div class="panel-section" style="margin-top:24px"><div class="panel-section-title">Project Phases</div>';
  phases.forEach((phase, i) => {
    const count = STORE.projects.filter(p => val(p, 'Phase') === phase).length;
    if (count > 0) {
      const pct = Math.round((count / totalP) * 100);
      html += `
        <div class="flow-stage">
          <span class="flow-count">${count}</span>
          <span class="flow-label">${phase}</span>
          <div class="flow-bar"><div class="flow-bar-fill" style="width:${pct}%"></div></div>
        </div>`;
    }
  });
  html += '</div>';
  body.innerHTML = html;
}

function renderTimelinePanel() {
  const body = document.getElementById('timeline-body');
  const events = [];

  // Collect events from leads
  STORE.leads.forEach(l => {
    events.push({
      date: val(l, 'Date Added') || '—',
      text: `Lead: ${val(l, 'Client')}`,
      sub: `${val(l, 'Status')} · ${val(l, 'Source')}`,
      dot: val(l, 'Notes').includes('⚠️') ? 'dot-red' : 'dot-blue',
    });
  });

  // Collect events from supervision
  STORE.supervision.forEach(s => {
    events.push({
      date: val(s, 'Date') || '—',
      text: val(s, 'Finding'),
      sub: `${val(s, 'Project')} · ${val(s, 'Severity')}`,
      dot: val(s, 'Severity') === 'Critical' ? 'dot-red' : val(s, 'Severity') === 'Major' ? 'dot-orange' : 'dot-green',
    });
  });

  // Sort by date descending
  events.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  body.innerHTML = `
    <div class="panel-section">
      <div class="panel-section-title">Activity Timeline</div>
      ${events.length === 0 ? '<div class="search-no-results">No events</div>' :
        events.map(e => `
          <div class="timeline-item">
            <div class="timeline-dot ${e.dot}"></div>
            <div class="timeline-content">
              <div class="timeline-date">${e.date}</div>
              <div class="timeline-text">${e.text}</div>
              <div class="timeline-text-sub">${e.sub}</div>
            </div>
          </div>
        `).join('')}
    </div>
  `;
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
