/**
 * Majaz CRM — Projects Page (Dynamic Kanban DnD + Table + Write-Back + Toasts)
 * Columns auto-generated from Notion data — future-proof.
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
    showSkeleton();
    const res = await API.projects();
    if (!res) return;
    projectsData = res.rows || [];

    document.getElementById('projects-search')?.addEventListener('input', render);
    document.getElementById('projects-filter-stage')?.addEventListener('change', render);
    document.getElementById('projects-filter-type')?.addEventListener('change', render);

    render();
  }

  function showSkeleton() {
    const el = document.getElementById('projects-content');
    el.innerHTML = `<div class="kanban">${'<div class="kanban-column stagger-in"><div class="kanban-col-header"><div class="skeleton skeleton-text" style="width:60%"></div></div><div class="kanban-cards"><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div></div></div>'.repeat(5)}</div>`;
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

  // ── Known stage metadata (labels + colors). Order = display order. ──
  const KNOWN_STAGES = [
    { key: 'Not started',                  label: 'Not Started',        color: 'var(--text-muted)' },
    { key: 'On Hold',                      label: 'On Hold',            color: 'var(--text-muted)' },
    { key: 'Kickoff',                      label: 'Kickoff',            color: 'var(--info)' },
    { key: '(SD) Schematic Design',        label: 'SD',                 color: 'var(--stage-sd)' },
    { key: '(DD) Design Development',      label: 'DD',                 color: 'var(--stage-dd)' },
    { key: '(CD) Construction Documents',  label: 'CD',                 color: 'var(--stage-cd)' },
    { key: '(AS) Authorities Submission',   label: 'AS',                color: 'var(--stage-as)' },
    { key: 'Bidding',                      label: 'Bidding',            color: 'var(--warning)' },
    { key: 'Progress',                     label: 'Supervision',        color: 'var(--stage-progress)' },
    { key: 'Completed',                    label: 'Completed',          color: 'var(--success)' },
    { key: 'Handing Over',                 label: 'Handing Over',       color: 'var(--success)' },
    { key: 'Done',                         label: 'Done',               color: 'var(--stage-done, var(--success))' },
  ];

  /**
   * Build dynamic columns:
   * 1. Start with all KNOWN_STAGES
   * 2. If data contains unknown stages, append them as extra columns
   * This means adding a new stage in Notion auto-creates a column.
   */
  function buildColumns(rows) {
    const seenStages = new Set(rows.map(p => p.stage).filter(Boolean));
    const columns = KNOWN_STAGES.filter(s => seenStages.has(s.key));
    // Any unknown stages → append with default styling
    const knownKeys = new Set(KNOWN_STAGES.map(s => s.key));
    seenStages.forEach(stage => {
      if (!knownKeys.has(stage)) {
        columns.push({ key: stage, label: stage, color: 'var(--gold)' });
      }
    });
    // If no data at all, show all known stages
    return columns.length ? columns : KNOWN_STAGES;
  }

  /** All unique stages (known + dynamic) for dropdowns */
  function getAllStages(rows) {
    const knownKeys = new Set(KNOWN_STAGES.map(s => s.key));
    const extras = [];
    rows.forEach(p => {
      if (p.stage && !knownKeys.has(p.stage)) {
        extras.push({ key: p.stage, label: p.stage, color: 'var(--gold)' });
      }
    });
    return [...KNOWN_STAGES, ...extras];
  }

  function renderKanban(el, rows) {
    const cols = buildColumns(rows);
    el.innerHTML = `<div class="kanban">${cols.map(col => {
      const cards = rows.filter(p => p.stage === col.key);
      return `<div class="kanban-column stagger-in" data-stage="${col.key}"
        ondragover="event.preventDefault();this.classList.add('drag-over');this.querySelector('.kanban-cards').classList.add('drag-over')"
        ondragleave="this.classList.remove('drag-over');this.querySelector('.kanban-cards').classList.remove('drag-over')"
        ondrop="handleDrop(event,'${col.key.replace(/'/g,"\\'")}');this.classList.remove('drag-over');this.querySelector('.kanban-cards').classList.remove('drag-over')">
        <div class="kanban-col-header">
          <span class="kanban-col-title" style="color:${col.color}">${col.label}</span>
          <span class="kanban-col-count">${cards.length}</span>
        </div>
        <div class="kanban-cards">${cards.map(p => {
          const pct = pctValue(p);
          return `
          <div class="kanban-card" id="card-${p.id}" draggable="true"
            ondragstart="event.dataTransfer.setData('text/plain','${p.id}');this.classList.add('dragging')"
            ondragend="this.classList.remove('dragging')"
            onclick="showProject('${p.id}')">
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

  // Drag-and-drop handler → write-back to Notion
  window.handleDrop = async function(event, newStage) {
    event.preventDefault();
    const projectId = event.dataTransfer.getData('text/plain');
    const proj = projectsData.find(p => p.id === projectId);
    if (!proj || proj.stage === newStage) return;

    const oldStage = proj.stage;
    proj.stage = newStage; // optimistic update
    render();

    showToast(`Moving "${proj.name}" to ${newStage.replace(/[()]/g,'')}...`, 'info');

    const result = await API.updateProject(projectId, { stage: newStage });
    if (result && !result.error) {
      showToast(`✅ "${proj.name}" stage updated in Notion!`, 'success');
      const card = document.getElementById(`card-${projectId}`);
      card?.classList.add('pulse');
    } else {
      proj.stage = oldStage; // revert
      render();
      showToast(`Failed to update "${proj.name}"`, 'error');
    }
  };

  function renderTable(el, rows) {
    el.innerHTML = `<div class="glass-card"><div class="data-table-wrap"><table class="data-table">
      <thead><tr>
        <th>SN</th><th>Name</th><th>Stage</th><th>Type</th>
        <th>Value (AED)</th><th>Description</th><th>FAB ID</th><th>Completion</th><th>Tasks</th>
      </tr></thead>
      <tbody>${rows.map(p => {
        const pct = pctValue(p);
        return `<tr style="cursor:pointer" onclick="showProject('${p.id}')">
        <td class="mono" style="color:var(--gold)">${p.sn||'—'}</td>
        <td style="color:var(--text-primary);font-weight:500">${p.name}</td>
        <td><span class="status-badge ${stageClass(p.stage)}">${shortStage(p.stage)}</span></td>
        <td>${p.service_type||'—'}</td>
        <td class="mono">${p.value != null ? new Intl.NumberFormat('en-AE', {style:'currency',currency:'AED',maximumFractionDigits:0}).format(p.value) : '—'}</td>
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
    const allStages = getAllStages(projectsData);

    openDetail(p.name, `
      <div class="detail-section"><div class="detail-label">Project Info</div>
        <div class="detail-value">SN: <span class="mono" style="color:var(--gold)">#${p.sn||'—'}</span></div>
        <div class="detail-value" style="display:flex;align-items:center;gap:8px">
          Stage:
          <select class="filter-select" id="detail-stage-select" style="padding:4px 8px;font-size:0.8rem">
            ${allStages.map(s => `<option value="${s.key}" ${p.stage===s.key?'selected':''}>${s.key.replace(/[()]/g,'')}</option>`).join('')}
          </select>
          <button class="btn btn-primary btn-sm" id="detail-save-stage" style="font-size:0.7rem">Save ↗</button>
        </div>
        <div class="detail-value">Type: ${p.service_type||'—'}</div>
        <div class="detail-value">Description: ${p.description||'—'}</div>
        ${p.value != null ? `<div class="detail-value">Value: <span class="mono" style="color:var(--gold)">${new Intl.NumberFormat('en-AE',{style:'currency',currency:'AED',maximumFractionDigits:0}).format(p.value)}</span></div>` : ''}
        ${p.fab_id ? `<div class="detail-value">FAB ID: <span class="mono">${p.fab_id}</span></div>` : ''}
        ${p.adm_id ? `<div class="detail-value">ADM ID: <span class="mono">${p.adm_id}</span></div>` : ''}
        ${p.plot_info ? `<div class="detail-value">Plot: ${p.plot_info}</div>` : ''}
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
          <span class="status-badge ${stageClass(t.status)}" style="font-size:0.65rem">${t.status||'—'}</span>
        </div>`).join('')}
      </div>` : '<div class="detail-section"><div class="detail-label">Tasks</div><div class="detail-value" style="color:var(--text-muted)">No linked tasks</div></div>'}
    `);

    // Attach write-back handler
    document.getElementById('detail-save-stage')?.addEventListener('click', async () => {
      const newStage = document.getElementById('detail-stage-select').value;
      showToast(`Updating stage to ${newStage.replace(/[()]/g,'')}...`, 'info');
      const result = await API.updateProject(id, { stage: newStage });
      if (result && !result.error) {
        showToast(`Stage updated in Notion!`, 'success');
        const proj = projectsData.find(pr => pr.id === id);
        if (proj) proj.stage = newStage;
        setTimeout(() => render(), 800);
      } else {
        showToast('Failed to update stage', 'error');
      }
    });
  };
})();
