/**
 * Majaz CRM — Projects Page v4.0.0
 * Dynamic Kanban DnD + Table + Side-Peek detail + Write-Back + Toasts.
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

  // ── Known stage metadata ──
  const KNOWN_STAGES = [
    { key: 'Not started',                  label: 'Not Started',   color: 'var(--text-muted)' },
    { key: 'On Hold',                      label: 'On Hold',       color: 'var(--text-muted)' },
    { key: 'Kickoff',                      label: 'Kickoff',       color: 'var(--info)' },
    { key: '(SD) Schematic Design',        label: 'SD',            color: 'var(--stage-sd)' },
    { key: '(DD) Design Development',      label: 'DD',            color: 'var(--stage-dd)' },
    { key: '(CD) Construction Documents',  label: 'CD',            color: 'var(--stage-cd)' },
    { key: '(AS) Authorities Submission',   label: 'AS',           color: 'var(--stage-as)' },
    { key: 'Bidding',                      label: 'Bidding',       color: 'var(--warning)' },
    { key: 'Progress',                     label: 'Supervision',   color: 'var(--stage-progress)' },
    { key: 'Completed',                    label: 'Completed',     color: 'var(--success)' },
    { key: 'Handing Over',                 label: 'Handing Over',  color: 'var(--success)' },
    { key: 'Done',                         label: 'Done',          color: 'var(--stage-done, var(--success))' },
  ];

  function buildColumns(rows) {
    const seenStages = new Set(rows.map(p => p.stage).filter(Boolean));
    const columns = KNOWN_STAGES.filter(s => seenStages.has(s.key));
    const knownKeys = new Set(KNOWN_STAGES.map(s => s.key));
    seenStages.forEach(stage => {
      if (!knownKeys.has(stage)) columns.push({ key: stage, label: stage, color: 'var(--gold)' });
    });
    return columns.length ? columns : KNOWN_STAGES;
  }

  function getAllStages(rows) {
    const knownKeys = new Set(KNOWN_STAGES.map(s => s.key));
    const extras = [];
    rows.forEach(p => {
      if (p.stage && !knownKeys.has(p.stage)) extras.push({ key: p.stage, label: p.stage, color: 'var(--gold)' });
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
    proj.stage = newStage;
    render();

    showToast(`Moving "${proj.name}" to ${newStage.replace(/[()]/g,'')}...`, 'info');

    const result = await API.updateProject(projectId, { stage: newStage });
    if (result && !result.error) {
      showToast(`✅ "${proj.name}" stage updated in Notion!`, 'success');
      const card = document.getElementById(`card-${projectId}`);
      card?.classList.add('pulse');
    } else {
      proj.stage = oldStage;
      render();
      showToast(`Failed to update "${proj.name}"`, 'error');
    }
  };

  function renderTable(el, rows) {
    el.innerHTML = `<div class="glass-card"><div class="data-table-wrap"><table class="data-table">
      <thead><tr>
        <th>SN</th><th>Name</th><th>Stage</th><th>Type</th>
        <th>Value (AED)</th><th>Description</th><th class="col-admin-only">FAB ID</th><th>Completion</th><th>Tasks</th>
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
        <td class="mono col-admin-only">${p.fab_id||'—'}</td>
        <td>${pct !== null ? `<div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>` : '—'}</td>
        <td style="text-align:center">${(p.task_ids||[]).length||'—'}</td>
      </tr>`;
      }).join('')}</tbody>
    </table></div></div>`;
  }

  // ── Show Project Detail (Side-Peek) ──
  window.showProject = async function(id) {
    const p = await API.project(id);
    if (!p) return;
    const pct = p.pct_completed != null && !Array.isArray(p.pct_completed) ? Math.round(p.pct_completed * 100) : null;
    const allStages = getAllStages(projectsData);
    const fmtCurrency = v => new Intl.NumberFormat('en-AE',{style:'currency',currency:'AED',maximumFractionDigits:0}).format(v);

    openSidePeek(`<span style="color:var(--gold)">${p.name}</span>`, `
      <!-- ── Project Info ── -->
      <details class="peek-section" open>
        <summary>📐 Project Info</summary>
        <div class="peek-section-body">
          <div class="peek-row"><span class="peek-label">SN</span><span class="mono" style="color:var(--gold)">#${p.sn||'—'}</span></div>
          <div class="peek-row"><span class="peek-label">Type</span><span class="status-badge ${p.service_type==='DESIGN'?'status-dd':'status-as'}">${p.service_type||'—'}</span></div>
          ${p.fab_id ? `<div class="peek-row"><span class="peek-label">FAB ID</span><span class="mono">${p.fab_id}</span></div>` : ''}
          ${p.adm_id ? `<div class="peek-row"><span class="peek-label">ADM ID</span><span class="mono">${p.adm_id}</span></div>` : ''}
          ${p.plot_info ? `<div class="peek-row"><span class="peek-label">Plot</span><span>📍 ${p.plot_info}</span></div>` : ''}
          ${pct !== null ? `<div class="peek-row"><span class="peek-label">Completion</span><span style="color:var(--gold);font-weight:600">${pct}%</span></div>
          <div class="progress-bar" style="margin-top:4px"><div class="progress-fill" style="width:${pct}%"></div></div>` : ''}
        </div>
      </details>

      <!-- ── Edit Project ── -->
      <details class="peek-section" open>
        <summary>✏️ Edit Project</summary>
        <div class="peek-section-body">
          <label class="peek-label">Stage</label>
          <select class="peek-input" id="detail-stage-select">
            ${allStages.map(s => `<option value="${s.key}" ${p.stage===s.key?'selected':''}>${s.key.replace(/[()]/g,'')}</option>`).join('')}
          </select>
          <label class="peek-label">Value (AED)</label>
          <input id="detail-project-value" type="number" class="peek-input" value="${p.value||''}" placeholder="Contract value..." />
          <label class="peek-label">Description</label>
          <textarea id="detail-project-desc" class="peek-input" style="min-height:60px;resize:vertical" placeholder="Project description...">${p.description||''}</textarea>
          <button class="btn btn-primary btn-sm" id="detail-save-project" style="width:100%;margin-top:8px">💾 Save to Notion</button>
        </div>
      </details>

      <!-- ── Client ── -->
      ${(p.client_ids||[]).length ? `
      <details class="peek-section" open>
        <summary>👥 Client</summary>
        <div class="peek-section-body">
          <div class="peek-row" style="color:var(--gold);cursor:pointer" onclick="showClient('${p.client_ids[0]}')">
            🔗 View linked client →
          </div>
        </div>
      </details>` : ''}

      <!-- ── Linked Tasks ── -->
      <details class="peek-section" ${(p.tasks||[]).length ? 'open' : ''}>
        <summary>✅ Tasks (${(p.tasks||[]).length})</summary>
        <div class="peek-section-body">
          ${(p.tasks||[]).length ? p.tasks.map(t => `<div style="padding:6px 0;border-bottom:1px solid var(--glass-border);display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:0.85rem;color:var(--text-primary)">${t.name}</span>
            <span class="status-badge ${stageClass(t.status)}" style="font-size:0.65rem">${t.status||'—'}</span>
          </div>`).join('') : '<div style="color:var(--text-muted)">No linked tasks</div>'}
        </div>
      </details>

      <!-- ── Meta ── -->
      <details class="peek-section">
        <summary>Meta</summary>
        <div class="peek-section-body">
          <div class="peek-row"><span class="peek-label">Created</span><span class="mono" style="font-size:0.75rem">${p.created || '—'}</span></div>
        </div>
      </details>
    `);

    // Unified save handler
    document.getElementById('detail-save-project')?.addEventListener('click', async () => {
      const newStage = document.getElementById('detail-stage-select').value;
      const valInput = document.getElementById('detail-project-value')?.value;
      const descInput = document.getElementById('detail-project-desc')?.value?.trim();

      const payload = { stage: newStage };
      if (valInput !== '' && valInput != null) payload.value = parseFloat(valInput);
      if (descInput !== undefined) payload.description = descInput;

      showToast('Saving project to Notion...', 'info');
      const result = await API.updateProject(id, payload);
      if (result && !result.error) {
        showToast('Project updated in Notion!', 'success');
        const proj = projectsData.find(pr => pr.id === id);
        if (proj) {
          proj.stage = newStage;
          if (payload.value != null) proj.value = payload.value;
          if (payload.description != null) proj.description = descInput;
        }
        setTimeout(() => render(), 800);
      } else {
        showToast('Failed to update project', 'error');
      }
    });
  };

  // ── Add Project Form ──
  window.showAddProjectForm = function() {
    openSidePeek('➕ New Project', `
      <details class="peek-section" open>
        <summary>Project Information</summary>
        <div class="peek-section-body">
          <label class="peek-label">Project Name *</label>
          <input id="new-proj-name" class="peek-input" placeholder="Project name..." />
          <label class="peek-label">SN (Serial Number)</label>
          <input id="new-proj-sn" type="number" class="peek-input" placeholder="e.g. 210" />
          <label class="peek-label">Service Type</label>
          <select id="new-proj-type" class="peek-input">
            <option value="">Select...</option>
            <option value="DESIGN">Design</option>
            <option value="SUPERVISION">Supervision</option>
          </select>
          <label class="peek-label">Stage</label>
          <select id="new-proj-stage" class="peek-input">
            ${KNOWN_STAGES.map(s => `<option value="${s.key}">${s.key.replace(/[()]/g,'')}</option>`).join('')}
          </select>
          <label class="peek-label">Value (AED)</label>
          <input id="new-proj-value" type="number" class="peek-input" placeholder="Contract value..." />
          <label class="peek-label">Description</label>
          <textarea id="new-proj-desc" class="peek-input" style="min-height:60px;resize:vertical" placeholder="Project description..."></textarea>
          <button class="btn btn-primary" onclick="submitNewProject()" style="width:100%;margin-top:12px">Create Project → Notion</button>
        </div>
      </details>
    `);
  };

  window.submitNewProject = async function() {
    const name = document.getElementById('new-proj-name')?.value?.trim();
    if (!name) { showToast('Project name is required', 'error'); return; }
    const data = {
      name,
      sn: document.getElementById('new-proj-sn')?.value ? parseInt(document.getElementById('new-proj-sn').value) : undefined,
      service_type: document.getElementById('new-proj-type')?.value || undefined,
      stage: document.getElementById('new-proj-stage')?.value || undefined,
      value: document.getElementById('new-proj-value')?.value ? parseFloat(document.getElementById('new-proj-value').value) : undefined,
      description: document.getElementById('new-proj-desc')?.value?.trim() || undefined,
    };
    const res = await API.createProject(data);
    if (res && res.id) {
      showToast('Project created in Notion!', 'success');
      loaded = false;
      loadProjects();
      closeSidePeek();
    } else {
      showToast('Failed to create project', 'error');
    }
  };
})();
