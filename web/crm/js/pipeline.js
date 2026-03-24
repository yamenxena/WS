/**
 * Majaz CRM — Work Pipeline Page
 * Renders all pipeline items from Notion with stage grouping and project links.
 */
(() => {
  let pipelineData = [];
  let loaded = false;

  window.addEventListener('viewChange', (e) => {
    if (e.detail.view === 'pipeline' && !loaded) loadPipeline();
  });

  async function loadPipeline() {
    loaded = true;
    const res = await API.pipeline();
    if (!res) return;
    pipelineData = res.rows || [];
    const badge = document.getElementById('badge-pipeline');
    if (badge) badge.textContent = pipelineData.length;

    // Populate stage filter dynamically
    const stages = [...new Set(pipelineData.map(p => p.stage).filter(Boolean))].sort();
    const stageSelect = document.getElementById('pipeline-filter-stage');
    stages.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s; opt.textContent = s;
      stageSelect.appendChild(opt);
    });

    renderTable(pipelineData);
    document.getElementById('pipeline-search')?.addEventListener('input', applyFilters);
    document.getElementById('pipeline-filter-stage')?.addEventListener('change', applyFilters);
  }

  function applyFilters() {
    const q = (document.getElementById('pipeline-search')?.value || '').toLowerCase();
    const stage = document.getElementById('pipeline-filter-stage')?.value || '';
    let filtered = pipelineData;
    if (q) filtered = filtered.filter(p => (p.name||'').toLowerCase().includes(q));
    if (stage) filtered = filtered.filter(p => p.stage === stage);
    renderTable(filtered);
  }

  function renderTable(rows) {
    const el = document.getElementById('pipeline-content');
    if (!rows.length) {
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔄</div><div class="empty-state-text">No pipeline items found</div></div>';
      return;
    }

    el.innerHTML = `<div class="glass-card"><div class="data-table-wrap"><table class="data-table">
      <thead><tr>
        <th>Task</th><th>Stage</th><th>Type</th><th>Duration (days)</th><th>Linked Projects</th>
      </tr></thead>
      <tbody>${rows.map(p => `<tr style="cursor:pointer" onclick="showPipelineItem('${p.id}')">
        <td style="color:var(--text-primary);font-weight:500">${p.name || '—'}</td>
        <td><span class="status-badge ${stageClass(p.stage)}">${shortStage(p.stage) || '—'}</span></td>
        <td>${p.task_type || '—'}</td>
        <td class="mono" style="text-align:center">${p.duration != null ? p.duration : '—'}</td>
        <td style="color:var(--gold);text-align:center">${(p.project_ids||[]).length || '—'}</td>
      </tr>`).join('')}</tbody>
    </table></div></div>`;
  }

  window.showPipelineItem = function(id) {
    const p = pipelineData.find(x => x.id === id);
    if (!p) return;
    openDetail(p.name || 'Pipeline Item', `
      <div class="detail-section"><div class="detail-label">🔄 Pipeline Details</div>
        <div class="detail-value">Task: <strong style="color:var(--text-primary)">${p.name || '—'}</strong></div>
        <div class="detail-value">Stage: <span class="status-badge ${stageClass(p.stage)}">${p.stage || '—'}</span></div>
        <div class="detail-value">Type: ${p.task_type || '—'}</div>
        <div class="detail-value">Duration: <span class="mono">${p.duration != null ? p.duration + ' days' : '—'}</span></div>
      </div>
      <div class="detail-section"><div class="detail-label">📐 Linked Projects (${(p.project_ids||[]).length})</div>
        ${(p.project_ids||[]).length
          ? p.project_ids.map(pid => `<div class="detail-value" style="color:var(--gold);cursor:pointer" onclick="showProject('${pid}')">🔗 View project →</div>`).join('')
          : '<div class="detail-value" style="color:var(--text-muted)">No linked projects</div>'}
      </div>
    `);
  };
})();
