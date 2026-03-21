// Majaz AI OS — Dashboard App
// Renders all views from DATA object

document.addEventListener('DOMContentLoaded', () => {
  // Set current date
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

  // Render all views
  renderDashboard();
  renderCRM();
  renderProjects();
  renderTasks();
  renderSupervision();
  renderContent();
});


// --- Helpers ---
function fmt(n) { return n.toLocaleString('en-AE'); }
function statusClass(s) { return 'status-' + s.toLowerCase().replace(/\s+/g, '').replace('sent',''); }
function phaseClass(p) { return 'phase-' + p.toLowerCase().replace(/\s+/g, ''); }
function sevClass(s) {
  if (s === 'Critical') return 'sev-critical';
  if (s === 'Major') return 'sev-major';
  if (s === 'Minor') return 'sev-minor';
  return 'sev-obs';
}


// ========================
// DASHBOARD VIEW
// ========================
function renderDashboard() {
  const el = document.getElementById('view-dashboard');
  const totalFees = DATA.projects.reduce((s, p) => s + p.fee, 0);
  const totalPaid = DATA.projects.reduce((s, p) => s + p.paid, 0);
  const totalOverdue = DATA.invoices.reduce((s, i) => s + i.amount, 0);
  const activeLeads = DATA.leads.filter(l => !['Won','Lost'].includes(l.status)).length;
  const overdueLeads = DATA.leads.filter(l => l.overdue).length;
  const overdueTaskCount = DATA.tasks.filter(t => t.overdue).length;

  el.innerHTML = `
    <div class="page-header">
      <h1>Dashboard</h1>
      <p>Majaz Engineering Consultancy — AI OS Overview</p>
    </div>

    ${overdueLeads > 0 ? `
    <div class="alert-banner">
      <span class="alert-icon">🚨</span>
      <span class="alert-text">
        <strong>${overdueLeads} leads with overdue responses</strong> — 
        ${DATA.leads.filter(l=>l.overdue).map(l=>l.name).join(', ')}
      </span>
    </div>` : ''}

    ${totalOverdue > 0 ? `
    <div class="alert-banner">
      <span class="alert-icon">💰</span>
      <span class="alert-text">
        <strong>AED ${fmt(totalOverdue)} in overdue invoices</strong> — 
        ${DATA.invoices.map(i=>`${i.id} (${i.daysOverdue}d)`).join(', ')}
      </span>
    </div>` : ''}

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Active Projects</div>
        <div class="metric-value gold">${DATA.projects.length}</div>
        <div class="metric-detail">${DATA.projects.filter(p=>p.location.includes('Dubai')).length} Dubai · ${DATA.projects.filter(p=>p.location.includes('AD')).length} Abu Dhabi</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Pipeline Leads</div>
        <div class="metric-value ${overdueLeads > 0 ? 'warning' : 'success'}">${activeLeads}</div>
        <div class="metric-detail">${overdueLeads} overdue responses</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Total Fees</div>
        <div class="metric-value gold">AED ${fmt(totalFees)}</div>
        <div class="metric-detail">${fmt(totalPaid)} received (${Math.round(totalPaid/totalFees*100)}%)</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Overdue Invoices</div>
        <div class="metric-value danger">AED ${fmt(totalOverdue)}</div>
        <div class="metric-detail">${DATA.invoices.length} invoices overdue</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Tasks</div>
        <div class="metric-value ${overdueTaskCount > 0 ? 'danger' : 'success'}">${DATA.tasks.length}</div>
        <div class="metric-detail">${overdueTaskCount} overdue · ${DATA.tasks.filter(t=>t.status==='In Progress').length} in progress</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Content (March)</div>
        <div class="metric-value warning">0 / 3</div>
        <div class="metric-detail">Behind schedule</div>
      </div>
    </div>

    <div class="section-header">
      <span class="section-title">⚠️ Overdue Invoices</span>
    </div>
    <div class="table-container">
      <table>
        <thead><tr><th>Invoice</th><th>Project</th><th>Amount</th><th>Due Date</th><th>Days Overdue</th></tr></thead>
        <tbody>
          ${DATA.invoices.map(i => `
          <tr>
            <td>${i.id}</td>
            <td>${i.project}</td>
            <td style="color:var(--red);font-weight:700">AED ${fmt(i.amount)}</td>
            <td>${i.due}</td>
            <td><span class="status sev-critical">${i.daysOverdue} days</span></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="section-header">
      <span class="section-title">🏗️ Bottleneck Analysis</span>
    </div>
    <div class="alert-banner warning">
      <span class="alert-icon">⚠️</span>
      <span class="alert-text">
        <strong>Waseem is handling everything:</strong>
        2 concept designs + municipality follow-ups + supervision (2-3 visits/week) + 8 leads + content + invoicing.
        Delegation needed: junior for supervision reports, admin for lead responses & invoice follow-ups.
      </span>
    </div>

    <div class="section-header">
      <span class="section-title">📗 Google Sheets</span>
      <a class="section-link" href="${DATA.sheetsUrl}" target="_blank">Open in Google Sheets ↗</a>
    </div>
    <div class="sheets-embed">
      <iframe src="${DATA.sheetsEmbedUrl}" loading="lazy"></iframe>
    </div>
  `;
}


// ========================
// CRM KANBAN VIEW
// ========================
function renderCRM() {
  const el = document.getElementById('view-crm');
  const stages = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];

  const lanes = stages.map(stage => {
    const items = DATA.leads.filter(l => l.status === stage);
    const cards = items.map(l => `
      <div class="kanban-card ${l.overdue ? 'overdue' : ''}">
        <div class="kanban-card-title">
          <span class="icp icp-${l.icp}">${l.icp}</span> ${l.name}
        </div>
        <div class="kanban-card-meta">
          <span>💰 AED ${l.budget} · ${l.location}</span>
          <span>📍 ${l.source} · ${l.type}</span>
          <span>➡️ ${l.next}</span>
          ${l.notes ? `<span style="color:var(--orange);margin-top:4px">${l.notes}</span>` : ''}
        </div>
      </div>
    `).join('');

    return `
      <div class="kanban-lane">
        <div class="kanban-lane-header">
          <span class="kanban-lane-title">${stage}</span>
          <span class="kanban-lane-count">${items.length}</span>
        </div>
        <div class="kanban-lane-body">${cards || '<div style="text-align:center;color:var(--text-faint);padding:20px;font-size:12px">Empty</div>'}</div>
      </div>
    `;
  }).join('');

  el.innerHTML = `
    <div class="page-header">
      <h1>CRM Pipeline</h1>
      <p>${DATA.leads.length} total leads · ${DATA.leads.filter(l=>l.overdue).length} overdue responses</p>
    </div>
    <div class="kanban-board">${lanes}</div>
  `;
}


// ========================
// PROJECTS VIEW
// ========================
function renderProjects() {
  const el = document.getElementById('view-projects');
  const totalOverdue = DATA.projects.reduce((s, p) => s + p.overdue, 0);

  el.innerHTML = `
    <div class="page-header">
      <h1>Active Projects</h1>
      <p>${DATA.projects.length} projects · AED ${fmt(totalOverdue)} overdue</p>
    </div>

    <div class="table-container">
      <table>
        <thead><tr>
          <th>Project</th><th>Client</th><th>Location</th><th>Phase</th><th>Done</th>
          <th>Fee</th><th>Paid</th><th>Overdue</th><th>Issues</th>
        </tr></thead>
        <tbody>
          ${DATA.projects.map(p => `
          <tr>
            <td style="font-weight:600">${p.name}</td>
            <td>${p.client}</td>
            <td>${p.location}</td>
            <td><span class="status ${phaseClass(p.phase)}">${p.phase}</span></td>
            <td>
              <div style="display:flex;align-items:center;gap:8px">
                <div style="flex:1;height:6px;background:var(--bg-light);border-radius:3px;overflow:hidden">
                  <div style="width:${p.completion}%;height:100%;background:var(--gold);border-radius:3px"></div>
                </div>
                <span style="font-size:11px;color:var(--text-secondary)">${p.completion}%</span>
              </div>
            </td>
            <td>AED ${fmt(p.fee)}</td>
            <td style="color:var(--green)">AED ${fmt(p.paid)}</td>
            <td style="color:${p.overdue > 0 ? 'var(--red)' : 'var(--text-faint)'};font-weight:${p.overdue > 0 ? '700' : '400'}">
              ${p.overdue > 0 ? 'AED ' + fmt(p.overdue) : '—'}
            </td>
            <td style="font-size:12px;color:var(--text-secondary);max-width:200px">${p.issues}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="section-header">
      <span class="section-title">Payment Summary</span>
    </div>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Total Fees</div>
        <div class="metric-value gold">AED ${fmt(DATA.projects.reduce((s,p)=>s+p.fee,0))}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Received</div>
        <div class="metric-value success">AED ${fmt(DATA.projects.reduce((s,p)=>s+p.paid,0))}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Outstanding</div>
        <div class="metric-value warning">AED ${fmt(DATA.projects.reduce((s,p)=>s+p.outstanding,0))}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Overdue</div>
        <div class="metric-value danger">AED ${fmt(totalOverdue)}</div>
      </div>
    </div>
  `;
}


// ========================
// TASKS VIEW
// ========================
function renderTasks() {
  const el = document.getElementById('view-tasks');
  const groups = ['To Do', 'In Progress', 'Waiting'];

  const sections = groups.map(g => {
    const items = DATA.tasks.filter(t => t.status === g);
    const rows = items.map(t => `
      <tr>
        <td><span class="priority-${t.priority.toLowerCase()}">${t.priority}</span></td>
        <td style="font-weight:${t.overdue ? '700' : '500'};color:${t.overdue ? 'var(--red)' : 'var(--text-primary)'}">
          ${t.title}
          ${t.detail ? `<div style="font-size:11px;color:var(--text-secondary);margin-top:2px">${t.detail}</div>` : ''}
        </td>
        <td style="font-size:12px">${t.project}</td>
        <td style="font-size:12px;${t.overdue ? 'color:var(--red);font-weight:700' : ''}">${t.due || '—'}</td>
      </tr>
    `).join('');

    return `
      <div class="table-container">
        <div class="table-header">
          <span class="table-title">${g}</span>
          <span style="font-size:11px;color:var(--text-faint)">${items.length} items</span>
        </div>
        <table>
          <thead><tr><th style="width:50px">P</th><th>Task</th><th>Project</th><th>Due</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }).join('');

  el.innerHTML = `
    <div class="page-header">
      <h1>Task Board</h1>
      <p>${DATA.tasks.length} tasks · ${DATA.tasks.filter(t=>t.overdue).length} overdue</p>
    </div>

    ${DATA.tasks.filter(t=>t.overdue).length > 0 ? `
    <div class="alert-banner">
      <span class="alert-icon">🔴</span>
      <span class="alert-text">
        <strong>${DATA.tasks.filter(t=>t.overdue).length} overdue items need action TODAY:</strong>
        ${DATA.tasks.filter(t=>t.overdue).map(t=>t.title).join(' · ')}
      </span>
    </div>` : ''}

    ${sections}
  `;
}


// ========================
// SUPERVISION VIEW
// ========================
function renderSupervision() {
  const el = document.getElementById('view-supervision');
  const openCount = DATA.supervision.filter(s => s.status !== 'Closed').length;

  el.innerHTML = `
    <div class="page-header">
      <h1>Supervision Log</h1>
      <p>${DATA.supervision.length} entries · ${openCount} open findings</p>
    </div>

    <div class="table-container">
      <table>
        <thead><tr><th>Date</th><th>Project</th><th>Category</th><th>Finding</th><th>Severity</th><th>Action</th><th>Deadline</th><th>Status</th></tr></thead>
        <tbody>
          ${DATA.supervision.map(s => `
          <tr>
            <td style="white-space:nowrap">${s.date}</td>
            <td style="font-weight:500">${s.project}</td>
            <td>${s.category}</td>
            <td style="max-width:250px">${s.finding}</td>
            <td><span class="status ${sevClass(s.severity)}">${s.severity}</span></td>
            <td style="font-size:12px">${s.action}</td>
            <td style="white-space:nowrap">${s.deadline}</td>
            <td><span class="status ${s.status === 'Open' ? 'status-open' : s.status === 'In Progress' ? 'status-progress' : 'status-closed'}">${s.status}</span></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}


// ========================
// CONTENT VIEW
// ========================
function renderContent() {
  const el = document.getElementById('view-content');
  const published = DATA.content.filter(c => c.status === 'Published').length;

  el.innerHTML = `
    <div class="page-header">
      <h1>Content Pipeline</h1>
      <p>March target: 3 posts · Published: ${published} · Behind schedule</p>
    </div>

    <div class="alert-banner warning">
      <span class="alert-icon">📱</span>
      <span class="alert-text">
        <strong>0 / 3 March posts published.</strong>
        Waseem bottleneck — no bandwidth for content. Delegate: agent drafts captions, junior takes site photos.
      </span>
    </div>

    <div class="table-container">
      <div class="table-header">
        <span class="table-title">Content Calendar</span>
      </div>
      <table>
        <thead><tr><th>Week</th><th>Date</th><th>Platform</th><th>Topic</th><th>Lang</th><th>Status</th><th>Blocked By</th></tr></thead>
        <tbody>
          ${DATA.content.map(c => `
          <tr>
            <td style="font-weight:600;color:var(--text-faint)">${c.week}</td>
            <td style="white-space:nowrap">${c.date}</td>
            <td>${c.platform}</td>
            <td>${c.topic}</td>
            <td>${c.lang}</td>
            <td><span class="status ${c.status === 'Missed' ? 'sev-critical' : c.status === 'Draft' ? 'status-open' : 'status-progress'}">${c.status}</span></td>
            <td style="font-size:12px;color:var(--text-secondary)">${c.blocked || '—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}
