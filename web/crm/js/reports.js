/**
 * Majaz CRM — Reports Page
 */
(() => {
  let loaded = false;

  window.addEventListener('viewChange', (e) => {
    if (e.detail.view === 'reports' && !loaded) loadReports();
  });

  async function loadReports() {
    loaded = true;
    const data = await API.dashboard();
    if (!data) return;

    const el = document.getElementById('reports-content');
    const stages = data.stages || {};
    const types = data.service_types || {};
    const taskStatuses = data.task_statuses || {};
    const leads = data.lead_statuses || {};

    el.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px">
        ${buildBarChart('Project Stages', stages, {
          'Not started': 'var(--text-muted)',
          'On Hold': 'var(--text-muted)',
          'Kickoff': 'var(--info)',
          '(SD) Schematic Design': 'var(--stage-sd)',
          '(DD) Design Development': 'var(--stage-dd)',
          '(CD) Construction Documents': 'var(--stage-cd)',
          '(AS) Authorities Submission': 'var(--stage-as)',
          'Bidding': 'var(--warning)',
          'Progress': 'var(--danger)',
          'Completed': 'var(--success)',
          'Handing Over': 'var(--success)',
          'Done': 'var(--success)',
        })}
        ${buildBarChart('Service Types', types, { 'DESIGN': 'var(--info)', 'SUPERVISION': 'var(--warning)' })}
        ${buildBarChart('Task Statuses', taskStatuses, {
          'Not started': 'var(--text-muted)',
          'SENT TO STRUCTURE': 'var(--stage-cd)',
          'NEEDS REVIEW': 'var(--stage-cd)',
          'In progress': 'var(--info)',
          'SENT TO CLIENT': 'var(--stage-as)',
          'SUBMITTED TO AUTHORITIES': 'var(--stage-as)',
          'Done': 'var(--success)',
        })}
        ${buildBarChart('Lead Statuses', leads, {
          'Inquiry': 'var(--text-muted)',
          'Qualified': 'var(--stage-sd)',
          'Proposal': 'var(--stage-dd)',
          'Negotiation': 'var(--stage-cd)',
          'Won': 'var(--success)',
          'Lost': 'var(--danger)',
        })}
      </div>

      <div class="glass-card" style="margin-top:24px">
        <div class="glass-card-header">
          <span class="glass-card-title">Summary</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px">
          <div style="text-align:center;padding:16px">
            <div style="font-size:2rem;font-weight:700;color:var(--gold)">${data.total_projects}</div>
            <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px">Total Projects</div>
          </div>
          <div style="text-align:center;padding:16px">
            <div style="font-size:2rem;font-weight:700;color:var(--info)">${data.total_clients}</div>
            <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px">Total Clients</div>
          </div>
          <div style="text-align:center;padding:16px">
            <div style="font-size:2rem;font-weight:700;color:var(--success)">${taskStatuses.Done || 0}</div>
            <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px">Tasks Completed</div>
          </div>
          <div style="text-align:center;padding:16px">
            <div style="font-size:2rem;font-weight:700;color:var(--danger)">${taskStatuses['Not started'] || 0}</div>
            <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px">Tasks Pending</div>
          </div>
        </div>
      </div>
    `;
  }

  function buildBarChart(title, dataObj, colorMap) {
    const entries = Object.entries(dataObj);
    if (!entries.length) return '';
    const max = Math.max(...entries.map(e => e[1]), 1);

    return `<div class="glass-card">
      <div class="glass-card-header"><span class="glass-card-title">${title}</span></div>
      ${entries.map(([key, val]) => {
        const pct = Math.round((val / max) * 100);
        const color = colorMap[key] || 'var(--gold)';
        const label = key.replace(/\(|\)/g, '');
        return `<div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;margin-bottom:3px">
            <span style="font-size:0.78rem;color:var(--text-secondary)">${label}</span>
            <span style="font-size:0.78rem;font-weight:600;color:var(--text-primary)">${val}</span>
          </div>
          <div style="height:6px;background:var(--bg-hover);border-radius:3px;overflow:hidden">
            <div style="width:${pct}%;height:100%;background:${color};border-radius:3px"></div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }
})();
