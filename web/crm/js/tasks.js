/**
 * Majaz CRM — Tasks Page (Dynamic Board + List + Write-Back + Toasts)
 * Columns auto-generated from Notion data — future-proof.
 */
(() => {
  let tasksData = [];
  let loaded = false;
  let viewMode = 'board';

  window.addEventListener('viewChange', (e) => {
    if (e.detail.view === 'tasks' && !loaded) loadTasks();
  });

  document.getElementById('tasks-view-board')?.addEventListener('click', () => { viewMode = 'board'; render(); });
  document.getElementById('tasks-view-list')?.addEventListener('click', () => { viewMode = 'list'; render(); });

  async function loadTasks() {
    loaded = true;
    showSkeleton();
    const res = await API.tasks();
    if (!res) return;
    tasksData = res.rows || [];

    document.getElementById('tasks-search')?.addEventListener('input', render);
    document.getElementById('tasks-filter-status')?.addEventListener('change', render);

    render();
  }

  function showSkeleton() {
    const el = document.getElementById('tasks-content');
    el.innerHTML = `<div class="kanban">${'<div class="kanban-column stagger-in" style="flex:1;max-width:none"><div class="kanban-col-header"><div class="skeleton skeleton-text" style="width:60%"></div></div><div class="kanban-cards"><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div></div></div>'.repeat(3)}</div>`;
  }

  function getFiltered() {
    const q = (document.getElementById('tasks-search')?.value || '').toLowerCase();
    const status = document.getElementById('tasks-filter-status')?.value || '';
    let filtered = tasksData;
    if (q) filtered = filtered.filter(t => t.name.toLowerCase().includes(q));
    if (status) filtered = filtered.filter(t => t.status === status);
    return filtered;
  }

  function render() {
    const filtered = getFiltered();
    const el = document.getElementById('tasks-content');
    if (viewMode === 'board') renderBoard(el, filtered);
    else renderList(el, filtered);
  }

  // ── Known status metadata (labels + colors). Order = Notion groups. ──
  const KNOWN_STATUSES = [
    // To-do group
    { key: 'Not started',              label: 'Not Started',            color: 'var(--text-muted)' },
    // In progress group
    { key: 'SENT TO STRUCTURE',        label: 'Sent to Structure',      color: 'var(--warning)' },
    { key: 'NEEDS REVIEW',             label: 'Needs Review',           color: 'var(--warning)' },
    { key: 'In progress',              label: 'In Progress',            color: 'var(--info)' },
    // Complete group
    { key: 'SENT TO CLIENT',           label: 'Sent to Client',         color: 'var(--stage-as, #AB47BC)' },
    { key: 'SUBMITTED TO AUTHORITIES', label: 'Submitted',              color: 'var(--stage-as, #AB47BC)' },
    { key: 'Done',                     label: 'Done',                   color: 'var(--success)' },
  ];

  /**
   * Build dynamic columns from data:
   * 1. Show only KNOWN_STATUSES that exist in the current data
   * 2. Append any unknown statuses as extra columns
   */
  function buildColumns(rows) {
    const seenStatuses = new Set(rows.map(t => t.status).filter(Boolean));
    const columns = KNOWN_STATUSES.filter(s => seenStatuses.has(s.key));
    // Any unknown statuses → append
    const knownKeys = new Set(KNOWN_STATUSES.map(s => s.key));
    seenStatuses.forEach(status => {
      if (!knownKeys.has(status)) {
        columns.push({ key: status, label: status, color: 'var(--gold)' });
      }
    });
    return columns.length ? columns : KNOWN_STATUSES;
  }

  /** All unique statuses for dropdowns */
  function getAllStatuses(rows) {
    const knownKeys = new Set(KNOWN_STATUSES.map(s => s.key));
    const extras = [];
    rows.forEach(t => {
      if (t.status && !knownKeys.has(t.status)) {
        extras.push({ key: t.status, label: t.status, color: 'var(--gold)' });
      }
    });
    return [...KNOWN_STATUSES, ...extras];
  }

  function renderBoard(el, rows) {
    const cols = buildColumns(rows);

    el.innerHTML = `<div class="kanban">${cols.map(col => {
      const cards = rows.filter(t => t.status === col.key);
      return `<div class="kanban-column stagger-in" style="flex:1;max-width:none" data-status="${col.key}"
        ondragover="event.preventDefault();this.classList.add('drag-over');this.querySelector('.kanban-cards').classList.add('drag-over')"
        ondragleave="this.classList.remove('drag-over');this.querySelector('.kanban-cards').classList.remove('drag-over')"
        ondrop="handleTaskDrop(event,'${col.key.replace(/'/g,"\\'")}');this.classList.remove('drag-over');this.querySelector('.kanban-cards').classList.remove('drag-over')">
        <div class="kanban-col-header">
          <span class="kanban-col-title" style="color:${col.color}">${col.label}</span>
          <span class="kanban-col-count">${cards.length}</span>
        </div>
        <div class="kanban-cards">${cards.map(t => `
          <div class="kanban-card" id="tcard-${t.id}" draggable="true"
            ondragstart="event.dataTransfer.setData('text/plain','${t.id}');this.classList.add('dragging')"
            ondragend="this.classList.remove('dragging')"
            onclick="showTaskDetail('${t.id}')">
            <div class="kanban-card-title">${t.name}</div>
            <div class="kanban-card-meta">
              ${t.due_date ? `<span>📅 ${t.due_date}</span>` : ''}
              ${t.deadline ? `<span style="color:${new Date(t.deadline) < new Date() ? 'var(--danger)' : 'var(--text-muted)'}">⏰ ${t.deadline}</span>` : ''}
              ${(t.assigned_to||[]).length ? `<span>👤 ${t.assigned_to.join(', ')}</span>` : ''}
              ${t.duration ? `<span>⏱ ${t.duration}d</span>` : ''}
            </div>
          </div>
        `).join('')}</div>
      </div>`;
    }).join('')}</div>`;
  }

  // Drag-and-drop for task board
  window.handleTaskDrop = async function(event, newStatus) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain');
    const task = tasksData.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    const oldStatus = task.status;
    task.status = newStatus;
    render();

    showToast(`Moving "${task.name}" to ${newStatus}...`, 'info');
    const result = await API.updateTask(taskId, { status: newStatus });
    if (result && !result.error) {
      showToast(`Task status updated in Notion!`, 'success');
      const card = document.getElementById(`tcard-${taskId}`);
      card?.classList.add('pulse');
    } else {
      task.status = oldStatus;
      render();
      showToast('Failed to update task', 'error');
    }
  };

  function renderList(el, rows) {
    el.innerHTML = `<div class="glass-card"><div class="data-table-wrap"><table class="data-table">
      <thead><tr>
        <th>Task</th><th>Status</th><th>Due Date</th><th>Deadline</th><th>Duration</th><th>Assigned To</th><th>Action</th>
      </tr></thead>
      <tbody>${rows.map(t => `<tr>
        <td style="color:var(--text-primary);font-weight:500;cursor:pointer" onclick="showTaskDetail('${t.id}')">${t.name}</td>
        <td><span class="status-badge ${stageClass(t.status)}">${t.status||'—'}</span></td>
        <td class="mono">${t.due_date||'—'}</td>
        <td class="mono" style="color:${t.deadline && new Date(t.deadline) < new Date() ? 'var(--danger)' : 'inherit'}">${t.deadline||'—'}</td>
        <td>${t.duration ? t.duration+'d' : '—'}</td>
        <td>${(t.assigned_to||[]).join(', ')||'—'}</td>
        <td>
          ${t.status !== 'Done' ? `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();markTaskDone('${t.id}','${t.name.replace(/'/g,"\\'")}')" style="font-size:0.7rem">✅ Done</button>` : '<span style="color:var(--success)">✓</span>'}
        </td>
      </tr>`).join('')}</tbody>
    </table></div></div>`;
  }

  window.showTaskDetail = function(id) {
    const t = tasksData.find(ts => ts.id === id);
    if (!t) return;
    const allStatuses = getAllStatuses(tasksData);

    openDetail(t.name, `
      <div class="detail-section"><div class="detail-label">Status</div>
        <div style="display:flex;align-items:center;gap:8px">
          <select class="filter-select" id="task-status-select" style="padding:4px 8px;font-size:0.8rem">
            ${allStatuses.map(s => `<option value="${s.key}" ${t.status===s.key?'selected':''}>${s.label}</option>`).join('')}
          </select>
          <button class="btn btn-primary btn-sm" id="task-save-status" style="font-size:0.7rem">Save ↗</button>
        </div>
      </div>
      <div class="detail-section"><div class="detail-label">Details</div>
        ${t.due_date ? `<div class="detail-value">📅 Due: ${t.due_date}</div>` : ''}
        ${t.deadline ? `<div class="detail-value" style="color:${new Date(t.deadline) < new Date() ? 'var(--danger)' : 'inherit'}">⏰ Deadline: ${t.deadline}</div>` : ''}
        ${t.duration ? `<div class="detail-value">⏱ Duration: ${t.duration} days</div>` : ''}
        ${(t.assigned_to||[]).length ? `<div class="detail-value">👤 Assigned: ${t.assigned_to.join(', ')}</div>` : ''}
        <div class="detail-value">Created: ${t.created || '—'}</div>
        ${t.last_edited ? `<div class="detail-value">Last Edited: ${t.last_edited}</div>` : ''}
      </div>
    `);

    document.getElementById('task-save-status')?.addEventListener('click', async () => {
      const newStatus = document.getElementById('task-status-select').value;
      showToast(`Updating task status...`, 'info');
      const result = await API.updateTask(id, { status: newStatus });
      if (result && !result.error) {
        showToast('Task status updated in Notion!', 'success');
        t.status = newStatus;
        setTimeout(() => render(), 800);
      } else {
        showToast('Failed to update task', 'error');
      }
    });
  };

  window.markTaskDone = async function(id, name) {
    showToast(`Marking "${name}" as Done...`, 'info');
    const result = await API.updateTask(id, { status: 'Done' });
    if (result && !result.error) {
      const t = tasksData.find(ts => ts.id === id);
      if (t) t.status = 'Done';
      render();
      showToast('Task completed!', 'success');
    } else {
      showToast('Failed to update task', 'error');
    }
  };

  // ── Add Task Form ──
  window.showAddTaskForm = async function() {
    // Fetch projects for the dropdown
    const projRes = await API.projects();
    const projects = projRes?.rows || [];

    openDetail('➕ New Task', `
      <div class="detail-section">
        <div class="detail-label">Task Information</div>
        <label style="display:block;margin:8px 0 4px;color:var(--text-muted);font-size:0.75rem">Task Name *</label>
        <input id="new-task-name" class="filter-input" style="width:100%;margin-bottom:8px" placeholder="Task name..." />
        <label style="display:block;margin:8px 0 4px;color:var(--text-muted);font-size:0.75rem">Status</label>
        <select id="new-task-status" class="filter-select" style="width:100%;margin-bottom:8px">
          ${KNOWN_STATUSES.map(s => `<option value="${s.key}">${s.label}</option>`).join('')}
        </select>
        <label style="display:block;margin:8px 0 4px;color:var(--text-muted);font-size:0.75rem">Due Date</label>
        <input id="new-task-due" type="date" class="filter-input" style="width:100%;margin-bottom:8px" />
        <label style="display:block;margin:8px 0 4px;color:var(--text-muted);font-size:0.75rem">Duration (days)</label>
        <input id="new-task-duration" type="number" class="filter-input" style="width:100%;margin-bottom:8px" placeholder="e.g. 14" />
        <label style="display:block;margin:8px 0 4px;color:var(--text-muted);font-size:0.75rem">Linked Project</label>
        <select id="new-task-project" class="filter-select" style="width:100%;margin-bottom:16px">
          <option value="">None</option>
          ${projects.map(p => `<option value="${p.id}">${p.sn ? '#'+p.sn+' ' : ''}${p.name}</option>`).join('')}
        </select>
        <button class="btn btn-primary" onclick="submitNewTask()" style="width:100%">Create Task → Notion</button>
      </div>
    `);
  };

  window.submitNewTask = async function() {
    const name = document.getElementById('new-task-name')?.value?.trim();
    if (!name) { showToast('Task name is required', 'error'); return; }
    const data = {
      name,
      status: document.getElementById('new-task-status')?.value || undefined,
      due_date: document.getElementById('new-task-due')?.value || undefined,
      duration: document.getElementById('new-task-duration')?.value ? parseInt(document.getElementById('new-task-duration').value) : undefined,
      project_id: document.getElementById('new-task-project')?.value || undefined,
    };
    const res = await API.createTask(data);
    if (res && res.id) {
      showToast('Task created in Notion!', 'success');
      loaded = false;
      loadTasks();
      document.getElementById('detail-close')?.click();
    } else {
      showToast('Failed to create task', 'error');
    }
  };
})();
