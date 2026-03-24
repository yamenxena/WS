/**
 * Majaz CRM — Projects Page (Kanban + Table + Write-Back)
 */
(() => {
  let projectsData = [];
  let loaded = false;
  let viewMode = 'kanban';

  window.addEventListener('viewChange', (e) => {
    if (e.detail.view === 'projects' && !loaded) loadProjects();
  });

  document.getElementById('projects-view-kanban')?.addEventListener('click', () => { viewMode = 'kanban'; render(); });
  document.getElementById('projects-view-table')?.addEventListener('click', () => { viewMode = 'table'; render(); });

  async function loadProjects() {
    loaded = true;
    const res = await API.projects();
    if (!res) return;
    projectsData = res.rows || [];

    document.getElementById('projects-search')?.addEventListener('input', render);
    document.getElementById('projects-filter-stage')?.addEventListener('change', render);
    document.getElementById('projects-filter-type')?.addEventListener('change', render);

    render();
  }

  function getFiltered() {
    const q = (document.getElementById('projects-search')?.value || '').toLowerCase();
    const stage = document.getElementById('projects-filter-stage')?.value || '';
    const type = document.getElementById('projects-filter-type')?.value || '';
    let filtered = projectsData;
    if (q) filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || (p.description||'').toLowerCase().includes(q));
    if (stage) filtered = filtered.filter(p => p.stage === stage);
    if (type) filtered = filtered.filter(p => p.service_type === type);
    return filtered;
  }

  function render() {
    const filtered = getFiltered();
    const el = document.getElementById('projects-content');
    if (viewMode === 'kanban') renderKanban(el, filtered);
    else renderTable(el, filtered);
  }

  function pctValue(p) {
    const v = p.pct_completed;
    if (v == null || Array.isArray(v)) return null;
    return Math.round(v * 100);
  }

  function renderKanban(el, rows) {
    const columns = [
      { key: '(SD) Schematic Design', label: 'SD — Schematic', color: 'var(--stage-sd)' },
      { key: '(DD) Design Development', label: 'DD — Design Dev', color: 'var(--stage-dd)' },
      { key: '(CD) Construction Documents', label: 'CD — Construction', color: 'var(--stage-cd)' },
      { key: '(AS) Authorities Submission', label: 'AS — Authorities', color: 'var(--stage-as)' },
      { key: 'Progress', label: 'Supervision', color: 'var(--stage-progress)' },
    ];

    el.innerHTML = `<div class="kanban">${columns.map(col => {
      const cards = rows.filter(p => p.stage === col.key);
      return `<div class="kanban-column">
        <div class="kanban-col-header">
          <span class="kanban-col-title" style="color:${col.color}">${col.label}</span>
          <span class="kanban-col-count">${cards.length}</span>
        </div>
        <div class="kanban-cards">${cards.map(p => {
          const pct = pctValue(p);
          return `
          <div class="kanban-card" onclick="showProject('${p.id}')">
            <div class="kanban-card-title">${p.name}</div>
            <div class="kanban-card-meta">
              <span>${p.service_type || '—'}</span>
              ${pct !== null ? `<span style="color:var(--gold)">${pct}%</span>` : ''}
              ${p.sn ? `<span>#${p.sn}</span>` : ''}
            </div>
            ${pct !== null ? `<div class="progress-bar" style="margin-top:6px"><div class="progress-fill" style="width:${pct}%"></div></div>` : ''}
          </div>`;
        }).join('')}</div>
      </div>`;
    }).join('')}</div>`;
  }

  function renderTable(el, rows) {
    el.innerHTML = `<div class="glass-card"><div class="data-table-wrap"><table class="data-table">
      <thead><tr>
        <th>SN</th><th>Name</th><th>Stage</th><th>Type</th>
        <th>Description</th><th>FAB ID</th><th>Completion</th><th>Tasks</th>
      </tr></thead>
      <tbody>${rows.map(p => {
        const pct = pctValue(p);
        return `<tr style="cursor:pointer" onclick="showProject('${p.id}')">
        <td class="mono" style="color:var(--gold)">${p.sn||'—'}</td>
        <td style="color:var(--text-primary);font-weight:500">${p.name}</td>
        <td><span class="status-badge ${stageClass(p.stage)}">${shortStage(p.stage)}</span></td>
        <td>${p.service_type||'—'}</td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis">${p.description||'—'}</td>
        <td class="mono">${p.fab_id||'—'}</td>
        <td>${pct !== null ? `<div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>` : '—'}</td>
        <td style="text-align:center">${(p.task_ids||[]).length||'—'}</td>
      </tr>`;
      }).join('')}</tbody>
    </table></div></div>`;
  }

  window.showProject = async function(id) {
    const p = await API.project(id);
    if (!p) return;
    const pct = p.pct_completed != null && !Array.isArray(p.pct_completed) ? Math.round(p.pct_completed * 100) : null;

    const stageOptions = [
      '(SD) Schematic Design',
      '(DD) Design Development',
      '(CD) Construction Documents',
      '(AS) Authorities Submission',
      'Progress',
    ];

    openDetail(p.name, `
      <div class="detail-section"><div class="detail-label">Project Info</div>
        <div class="detail-value">SN: <span class="mono" style="color:var(--gold)">#${p.sn||'—'}</span></div>
        <div class="detail-value" style="display:flex;align-items:center;gap:8px">
          Stage:
          <select class="filter-select" id="detail-stage-select" style="padding:4px 8px;font-size:0.8rem">
            ${stageOptions.map(s => `<option value="${s}" ${p.stage===s?'selected':''}>${s.replace(/\(|\)/g,'')}</option>`).join('')}
          </select>
          <button class="btn btn-primary btn-sm" id="detail-save-stage" style="font-size:0.7rem">Save ↗</button>
        </div>
        <div class="detail-value">Type: ${p.service_type||'—'}</div>
        <div class="detail-value">Description: ${p.description||'—'}</div>
        ${p.fab_id ? `<div class="detail-value">FAB ID: <span class="mono">${p.fab_id}</span></div>` : ''}
        ${p.adm_id ? `<div class="detail-value">ADM ID: <span class="mono">${p.adm_id}</span></div>` : ''}
        ${pct !== null ? `<div class="detail-value">Completion: <strong style="color:var(--gold)">${pct}%</strong>
          <div class="progress-bar" style="margin-top:4px;width:120px"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>` : ''}
      </div>

      ${(p.client_ids||[]).length ? `
      <div class="detail-section"><div class="detail-label">Client</div>
        <div class="detail-value" style="color:var(--gold);cursor:pointer" onclick="showClient('${p.client_ids[0]}')">
          🔗 View linked client →
        </div>
      </div>` : ''}

      ${(p.tasks||[]).length ? `
      <div class="detail-section"><div class="detail-label">Tasks (${p.tasks.length})</div>
        ${p.tasks.map(t => `<div style="padding:8px 0;border-bottom:1px solid var(--glass-border);display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:0.85rem;color:var(--text-primary)">${t.name}</span>
          <span class="status-badge ${t.status==='Done'?'status-done':t.status==='In progress'?'status-dd':''}" style="font-size:0.65rem">${t.status||'—'}</span>
        </div>`).join('')}
      </div>` : '<div class="detail-section"><div class="detail-label">Tasks</div><div class="detail-value" style="color:var(--text-muted)">No linked tasks</div></div>'}

      <div id="detail-save-feedback" style="margin-top:12px;font-size:0.8rem;display:none"></div>
    `);

    // Attach write-back handler
    document.getElementById('detail-save-stage')?.addEventListener('click', async () => {
      const newStage = document.getElementById('detail-stage-select').value;
      const feedback = document.getElementById('detail-save-feedback');
      feedback.style.display = 'block';
      feedback.style.color = 'var(--text-muted)';
      feedback.textContent = '⏳ Saving to Notion...';

      const result = await API.updateProject(id, { stage: newStage });
      if (result && !result.error) {
        feedback.style.color = 'var(--success)';
        feedback.textContent = '✅ Stage updated in Notion!';
        // Update local data
        const proj = projectsData.find(pr => pr.id === id);
        if (proj) proj.stage = newStage;
        setTimeout(() => render(), 1000);
      } else {
        feedback.style.color = 'var(--danger)';
        feedback.textContent = '❌ Failed to save — check API';
      }
    });
  };
})();
