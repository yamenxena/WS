/**
 * Majaz CRM — Reports Page (Enriched)
 * Full analytics: Projects, Tasks, Clients, Pipeline, Meetings, Interactions.
 */
(() => {
  let loaded = false;

  window.addEventListener('viewChange', (e) => {
    if (e.detail.view === 'reports' && !loaded) loadReports();
  });

  async function loadReports() {
    loaded = true;
    const [data, pipelineRes, meetingsRes, interactionsRes] = await Promise.all([
      API.dashboard(),
      API.pipeline(),
      API.meetings(),
      API.interactions(),
    ]);
    if (!data) return;

    const el = document.getElementById('reports-content');
    const stages = data.stages || {};
    const types = data.service_types || {};
    const taskStatuses = data.task_statuses || {};
    const leads = data.lead_statuses || {};

    // Pipeline stage distribution
    const pipelineRows = pipelineRes?.rows || [];
    const pipelineStages = {};
    const pipelineTypes = {};
    pipelineRows.forEach(p => {
      const s = p.stage || 'Unknown';
      pipelineStages[s] = (pipelineStages[s] || 0) + 1;
      const t = p.task_type || 'Other';
      pipelineTypes[t] = (pipelineTypes[t] || 0) + 1;
    });

    // Meeting count
    const meetingCount = meetingsRes?.rows?.length || 0;
    const interactionCount = interactionsRes?.rows?.length || 0;

    // Calculate total value
    const totalDone = taskStatuses.Done || 0;
    const totalTasks = Object.values(taskStatuses).reduce((a, b) => a + b, 0);
    const completionRate = totalTasks ? Math.round((totalDone / totalTasks) * 100) : 0;

    el.innerHTML = `
      <!-- ── KPI Summary Cards ── -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:16px;margin-bottom:24px">
        ${kpiCard('●', data.total_projects, 'Projects', 'var(--gold)')}
        ${kpiCard('●', data.total_clients, 'Clients', 'var(--info)')}
        ${kpiCard('●', totalTasks, 'Tasks', 'var(--success)')}
        ${kpiCard('●', pipelineRows.length, 'Pipeline Items', 'var(--warning)')}
        ${kpiCard('●', meetingCount, 'Meetings', 'var(--stage-dd)')}
        ${kpiCard('●', interactionCount, 'Interactions', 'var(--stage-as)')}
        ${kpiCard('●', completionRate + '%', 'Completion Rate', completionRate > 70 ? 'var(--success)' : completionRate > 40 ? 'var(--warning)' : 'var(--danger)')}
      </div>

      <!-- ── Distribution Charts ── -->
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
        ${buildBarChart('Pipeline by Stage', pipelineStages, {
          '(SD) Schematic Design': 'var(--stage-sd)',
          '(DD) Design Development': 'var(--stage-dd)',
          '(CD) Construction Documents': 'var(--stage-cd)',
          '(AS) Authorities Submission': 'var(--stage-as)',
        })}
        ${buildBarChart('Pipeline by Type', pipelineTypes, {})}
      </div>
    `;
  }

  function kpiCard(icon, value, label, color) {
    return `<div class="glass-card" style="text-align:center;padding:20px">
      <div style="font-size:1.5rem;margin-bottom:4px">${icon}</div>
      <div style="font-size:2rem;font-weight:700;color:${color}">${value}</div>
      <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;text-transform:uppercase;letter-spacing:0.5px">${label}</div>
    </div>`;
  }

  function buildBarChart(title, dataObj, colorMap) {
    const entries = Object.entries(dataObj);
    if (!entries.length) return '';
    const max = Math.max(...entries.map(e => e[1]), 1);
    const total = entries.reduce((a, e) => a + e[1], 0);

    return `<div class="glass-card">
      <div class="glass-card-header">
        <span class="glass-card-title">${title}</span>
        <span style="font-size:0.75rem;color:var(--text-muted)">${total} total</span>
      </div>
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
            <div style="width:${pct}%;height:100%;background:${color};border-radius:3px;transition:width 0.4s ease"></div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }
})();
