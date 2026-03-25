/**
 * Majaz CRM — Dashboard (v3.0 — Skeleton + Stagger + Polish)
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

    // Show skeleton while loading
    const grid = document.getElementById('kpi-grid');
    grid.innerHTML = `
      <div class="skeleton skeleton-kpi stagger-in"></div>
      <div class="skeleton skeleton-kpi stagger-in"></div>
      <div class="skeleton skeleton-kpi stagger-in"></div>
      <div class="skeleton skeleton-kpi stagger-in"></div>
    `;
    const chartEl = document.getElementById('pipeline-chart');
    chartEl.innerHTML = `<div style="width:100%;max-width:600px">
      <div class="skeleton skeleton-text stagger-in" style="width:40%"></div>
      <div class="skeleton skeleton-card stagger-in" style="height:200px"></div>
    </div>`;

    const data = await API.dashboard();
    if (!data) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon"><i data-lucide="wifi-off" style="width:48px;height:48px;opacity:0.4"></i></div><div class="empty-state-text">Unable to reach server</div><div class="empty-state-sub">Check that the API is running, then try again</div><button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="location.reload()">Retry</button></div>';
      chartEl.innerHTML = '';
      if (window.lucide) lucide.createIcons();
      return;
    }

    // Update sidebar badges
    const bc = document.getElementById('badge-clients');
    const bp = document.getElementById('badge-projects');
    const bt = document.getElementById('badge-tasks');
    if (bc) bc.textContent = data.total_clients;
    if (bp) bp.textContent = data.total_projects;
    if (bt) bt.textContent = data.total_tasks;

    // ── P2 Bento Grid: KPI Cards ──
    const completedTasks = data.task_statuses?.Done || 0;
    const totalTasks = data.total_tasks || 1;
    const completionPct = Math.round((completedTasks / totalTasks) * 100);

    // Stage sparkline data for hero card
    const stages = data.stages || {};
    const stageVals = Object.values(stages);
    const stageMax = Math.max(...stageVals, 1);

    // Task status sparkline data
    const taskStatuses = data.task_statuses || {};
    const taskVals = Object.values(taskStatuses);
    const taskMax = Math.max(...taskVals, 1);

    // Build sparkline HTML helper
    function sparkline(values, max, color) {
      if (!values.length) return '';
      return `<div class="kpi-sparkline">${values.map(v =>
        `<div class="spark-bar" style="height:${Math.max(12, (v / max) * 100)}%;background:${color}"></div>`
      ).join('')}</div>`;
    }

    grid.innerHTML = `
      <div class="kpi-card kpi-hero stagger-in">
        <div>
          <div class="kpi-icon"><i data-lucide="ruler" class="nav-icon"></i></div>
          <div class="kpi-value">${data.total_projects}</div>
          <div class="kpi-label">Active Projects</div>
        </div>
        <div class="kpi-meta">
          <div class="kpi-sub">${Object.keys(stages).length} stages</div>
          ${sparkline(stageVals, stageMax, 'var(--gold)')}
        </div>
      </div>
      <div class="kpi-card stagger-in">
        <div class="kpi-icon"><i data-lucide="users" class="nav-icon"></i></div>
        <div class="kpi-value">${data.total_clients}</div>
        <div class="kpi-label">Clients</div>
      </div>
      <div class="kpi-card stagger-in">
        <div class="kpi-icon"><i data-lucide="check-circle" class="nav-icon"></i></div>
        <div class="kpi-value">${data.total_tasks}</div>
        <div class="kpi-label">Tasks</div>
        ${sparkline(taskVals, taskMax, 'var(--stage-sd)')}
      </div>
      <div class="kpi-card stagger-in">
        <div class="kpi-icon"><i data-lucide="activity" class="nav-icon"></i></div>
        <div class="kpi-value">${completionPct}%</div>
        <div class="kpi-label">Completion</div>
        <div class="progress-bar" style="margin-top:8px;width:100%">
          <div class="progress-fill" style="width:${completionPct}%"></div>
        </div>
      </div>
    `;

    // Re-initialize Lucide icons in KPI cards
    if (window.lucide) lucide.createIcons();

    // ── Pipeline chart (animated bars) ──
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
    let i = 0;

    for (const [stage, count] of Object.entries(stages)) {
      const pct = Math.round((count / maxCount) * 100);
      const color = stageColors[stage] || 'var(--gold)';
      const label = stage.replace(/\(|\)/g, '');
      barsHTML += `
        <div style="margin-bottom:12px" class="stagger-in">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="font-size:0.8rem;color:var(--text-secondary)">${label}</span>
            <span style="font-size:0.8rem;font-weight:600;color:var(--text-primary)">${count}</span>
          </div>
          <div style="height:8px;background:var(--bg-hover);border-radius:4px;overflow:hidden">
            <div style="width:0%;height:100%;background:${color};border-radius:4px;transition:width 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.1}s" data-target-width="${pct}%"></div>
          </div>
        </div>
      `;
      i++;
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

    // Animate bars after render
    requestAnimationFrame(() => {
      chartEl.querySelectorAll('[data-target-width]').forEach(bar => {
        bar.style.width = bar.dataset.targetWidth;
      });
    });

    // ── P2.5: Recent Activity Tile ──
    loadRecentActivity();
  }

  async function loadRecentActivity() {
    const container = document.getElementById('recent-activity');
    if (!container) return;
    container.innerHTML = '<div class="spinner" style="padding:20px"></div>';

    try {
      const interactions = await API.interactions();
      if (!interactions || !interactions.length) {
        container.innerHTML = `
          <div class="activity-list">
            <div class="activity-item">
              <div class="activity-dot"></div>
              <div class="activity-body">
                <div class="activity-title" style="color:var(--text-muted)">No recent activity</div>
                <div class="activity-sub">Interactions will appear here</div>
              </div>
            </div>
          </div>`;
        return;
      }

      // Sort by date descending, take last 5
      const sorted = interactions
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        .slice(0, 5);

      container.innerHTML = `<div class="activity-list">${sorted.map(ix => {
        const typeClass = (ix.type || '').toLowerCase().replace(/\s+/g, '-');
        const date = ix.date ? new Date(ix.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
        return `
          <div class="activity-item stagger-in">
            <div class="activity-dot type-${typeClass}"></div>
            <div class="activity-body">
              <div class="activity-title">${ix.title || 'Untitled'}</div>
              <div class="activity-sub">${ix.client_name || ''} ${ix.type ? '· ' + ix.type : ''}</div>
            </div>
            <div class="activity-time">${date}</div>
          </div>`;
      }).join('')}</div>`;
    } catch (e) {
      container.innerHTML = '<div style="padding:12px;font-size:0.8rem;color:var(--text-muted)">Could not load activity</div>';
    }
  }
})();
