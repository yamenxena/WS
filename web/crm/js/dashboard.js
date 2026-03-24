/**
 * Majaz CRM — Dashboard
 */
(() => {
  let loaded = false;

  window.addEventListener('viewChange', (e) => {
    if (e.detail.view === 'dashboard' && !loaded) loadDashboard();
  });

  // Auto-load on boot
  setTimeout(() => { if (!loaded) loadDashboard(); }, 100);

  async function loadDashboard() {
    loaded = true;
    const data = await API.dashboard();
    if (!data) return;

    // Update sidebar badges
    const bc = document.getElementById('badge-clients');
    const bp = document.getElementById('badge-projects');
    const bt = document.getElementById('badge-tasks');
    if (bc) bc.textContent = data.total_clients;
    if (bp) bp.textContent = data.total_projects;
    if (bt) bt.textContent = data.total_tasks;

    // KPI Cards
    const grid = document.getElementById('kpi-grid');
    const completedTasks = data.task_statuses?.Done || 0;
    const totalTasks = data.total_tasks || 1;
    const completionPct = Math.round((completedTasks / totalTasks) * 100);

    grid.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-icon">📐</div>
        <div class="kpi-value">${data.total_projects}</div>
        <div class="kpi-label">Projects</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">👥</div>
        <div class="kpi-value">${data.total_clients}</div>
        <div class="kpi-label">Clients</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">✅</div>
        <div class="kpi-value">${data.total_tasks}</div>
        <div class="kpi-label">Tasks</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">📊</div>
        <div class="kpi-value">${completionPct}%</div>
        <div class="kpi-label">Task Completion</div>
      </div>
    `;

    // Pipeline chart (simple CSS bars)
    const chartEl = document.getElementById('pipeline-chart');
    const stages = data.stages || {};
    const stageColors = {
      '(SD) Schematic Design': 'var(--stage-sd)',
      '(DD) Design Development': 'var(--stage-dd)',
      '(CD) Construction Documents': 'var(--stage-cd)',
      '(AS) Authorities Submission': 'var(--stage-as)',
      'Progress': 'var(--stage-progress)',
      'Done': 'var(--stage-done)',
    };

    const maxCount = Math.max(...Object.values(stages), 1);
    let barsHTML = '<div style="width:100%;max-width:600px">';

    for (const [stage, count] of Object.entries(stages)) {
      const pct = Math.round((count / maxCount) * 100);
      const color = stageColors[stage] || 'var(--gold)';
      const label = stage.replace(/\(|\)/g, '');
      barsHTML += `
        <div style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="font-size:0.8rem;color:var(--text-secondary)">${label}</span>
            <span style="font-size:0.8rem;font-weight:600;color:var(--text-primary)">${count}</span>
          </div>
          <div style="height:8px;background:var(--bg-hover);border-radius:4px;overflow:hidden">
            <div style="width:${pct}%;height:100%;background:${color};border-radius:4px;transition:width 0.6s ease"></div>
          </div>
        </div>
      `;
    }

    // Service type split
    const types = data.service_types || {};
    barsHTML += '<div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--glass-border)">';
    barsHTML += '<span style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em">Service Types</span>';

    for (const [type, count] of Object.entries(types)) {
      barsHTML += `
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:0.85rem">
          <span style="color:var(--text-secondary)">${type}</span>
          <span style="font-weight:600;color:var(--gold)">${count}</span>
        </div>
      `;
    }
    barsHTML += '</div></div>';

    chartEl.innerHTML = barsHTML;
  }
})();
