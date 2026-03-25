/**
 * Majaz CRM — Tasks Page v4.0.0
 * Dynamic Board + List + Side-Peek detail + DnD Write-Back + Toasts.
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

  // ── Known status metadata ──
  const KNOWN_STATUSES = [
    { key: 'Not started',              label: 'Not Started',        color: 'var(--text-muted)' },
    { key: 'SENT TO STRUCTURE',        label: 'Sent to Structure',  color: 'var(--warning)' },
    { key: 'NEEDS REVIEW',             label: 'Needs Review',       color: 'var(--warning)' },
    { key: 'In progress',              label: 'In Progress',        color: 'var(--info)' },
    { key: 'SENT TO CLIENT',           label: 'Sent to Client',     color: 'var(--stage-as, #AB47BC)' },
    { key: 'SUBMITTED TO AUTHORITIES', label: 'Submitted',          color: 'var(--stage-as, #AB47BC)' },
    { key: 'Done',                     label: 'Done',               color: 'var(--success)' },
  ];

  function buildColumns(rows) {
    const seenStatuses = new Set(rows.map(t => t.status).filter(Boolean));
    const columns = KNOWN_STATUSES.filter(s => seenStatuses.has(s.key));
    const knownKeys = new Set(KNOWN_STATUSES.map(s => s.key));
    seenStatuses.forEach(status => {
      if (!knownKeys.has(status)) columns.push({ key: status, label: status, color: 'var(--gold)' });
    });
    return columns.length ? columns : KNOWN_STATUSES;
  }

  function getAllStatuses(rows) {
    const knownKeys = new Set(KNOWN_STATUSES.map(s => s.key));
    const extras = [];
    rows.forEach(t => {
      if (t.status && !knownKeys.has(t.status)) extras.push({ key: t.status, label: t.status, color: 'var(--gold)' });
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
        <div class="kanban-cards">${cards.map((t, idx) => `
          <div class="kanban-card stagger-entrance" style="--i: ${idx}" id="tcard-${t.id}" draggable="true"
            ondragstart="event.dataTransfer.setData('text/plain','${t.id}');this.classList.add('dragging')"
            ondragend="this.classList.remove('dragging')"
            onclick="showTaskDetail('${t.id}')">
            <div class="kanban-card-title">${t.name}</div>
            <div class="kanban-card-meta">
              ${t.due_date ? `<span>${t.due_date}</span>` : ''}
              ${t.deadline ? `<span style="color:${new Date(t.deadline) < new Date() ? 'var(--danger)' : 'var(--text-muted)'}">${t.deadline}</span>` : ''}
              ${(t.assigned_to||[]).length ? `<span>${t.assigned_to.join(', ')}</span>` : ''}
              ${t.duration ? `<span>${t.duration}d</span>` : ''}
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
          ${t.status !== 'Done' ? `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();markTaskDone('${t.id}','${t.name.replace(/'/g,"\\'")}')">✓ Done</button>` : '<span style="color:var(--success)">✓</span>'}
        </td>
      </tr>`).join('')}</tbody>
    </table></div></div>`;
  }

  // ── Show Task Detail (Side-Peek) ──
  window.showTaskDetail = function(id) {
    const t = tasksData.find(ts => ts.id === id);
    if (!t) return;
    const allStatuses = getAllStatuses(tasksData);

    openSidePeek(`<span style="color:var(--gold)">${t.name}</span>`, `
      <!-- ── Status Edit ── -->
      <details class="peek-section" open>
        <summary>Status</summary>
        <div class="peek-section-body">
          <div style="display:flex;align-items:center;gap:8px">
            <select class="peek-input" id="task-status-select" style="flex:1">
              ${allStatuses.map(s => `<option value="${s.key}" ${t.status===s.key?'selected':''}>${s.label}</option>`).join('')}
            </select>
            <button class="btn btn-primary btn-sm" id="task-save-status">Save ↗</button>
          </div>
        </div>
      </details>

      <!-- ── Details ── -->
      <details class="peek-section" open>
        <summary>Details</summary>
        <div class="peek-section-body">
          ${t.due_date ? `<div class="peek-row"><span class="peek-label">Due Date</span><span class="mono">${t.due_date}</span></div>` : ''}
          ${t.deadline ? `<div class="peek-row"><span class="peek-label">Deadline</span><span class="mono" style="color:${new Date(t.deadline) < new Date() ? 'var(--danger)' : 'inherit'}">${t.deadline}</span></div>` : ''}
          ${t.duration ? `<div class="peek-row"><span class="peek-label">Duration</span><span>${t.duration} days</span></div>` : ''}
          ${(t.assigned_to||[]).length ? `<div class="peek-row"><span class="peek-label">Assigned To</span><span>${t.assigned_to.join(', ')}</span></div>` : ''}
        </div>
      </details>

      <!-- ── Meta ── -->
      <details class="peek-section">
        <summary>Meta</summary>
        <div class="peek-section-body">
          <div class="peek-row"><span class="peek-label">Created</span><span class="mono" style="font-size:0.75rem">${t.created || '—'}</span></div>
          ${t.last_edited ? `<div class="peek-row"><span class="peek-label">Last Edited</span><span class="mono" style="font-size:0.75rem">${t.last_edited}</span></div>` : ''}
        </div>
      </details>
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

  // ── Add Task Form (Side-Peek) ──
  let taskProjectCombo = null;

  window.showAddTaskForm = function() {
    openSidePeek('New Task', `
      <details class="peek-section" open>
        <summary>Task Information</summary>
        <div class="peek-section-body">
          <label class="peek-label">Task Name *</label>
          <input id="new-task-name" class="peek-input" placeholder="Task name..." />
          <label class="peek-label">Status</label>
          <select id="new-task-status" class="peek-input">
            ${KNOWN_STATUSES.map(s => `<option value="${s.key}">${s.label}</option>`).join('')}
          </select>
          <label class="peek-label">Due Date</label>
          <input id="new-task-due" type="date" class="peek-input" />
          <label class="peek-label">Duration (days)</label>
          <input id="new-task-duration" type="number" class="peek-input" placeholder="e.g. 14" />
          <label class="peek-label">Linked Project</label>
          <div id="new-task-project-combo"></div>
          <button class="btn btn-primary" id="btn-submit-task" style="width:100%;margin-top:12px">Create Task → Notion</button>
        </div>
      </details>
    `);

    // Initialize ComboBox for project relation
    taskProjectCombo = createComboBox({
      containerId: 'new-task-project-combo',
      placeholder: 'Search projects...',
      fetchOptions: async () => {
        const res = await API.projects();
        return (res?.rows || []).map(p => ({
          value: p.id,
          label: p.name,
          sub: p.sn ? `#${p.sn}` : (p.service_type || ''),
        }));
      },
      formatLabel: (opt) => `${opt.label}${opt.sub ? ' (' + opt.sub + ')' : ''}`,
    });

    document.getElementById('btn-submit-task')?.addEventListener('click', submitNewTask);
  };

  window.submitNewTask = async function() {
    // Inline validation
    const nameValid = validateRequired('new-task-name', 'Task name is required');
    if (!nameValid) return;

    const name = document.getElementById('new-task-name').value.trim();
    const data = {
      name,
      status: document.getElementById('new-task-status')?.value || undefined,
      due_date: document.getElementById('new-task-due')?.value || undefined,
      duration: document.getElementById('new-task-duration')?.value ? parseInt(document.getElementById('new-task-duration').value) : undefined,
      project_id: taskProjectCombo?.getValue() || undefined,
    };
    showToast('Creating task...', 'info');
    const res = await API.createTask(data);
    if (res && res.id) {
      showToast('Task created in Notion!', 'success');
      loaded = false;
      loadTasks();
      closeSidePeek();
    } else {
      showToast('Failed to create task', 'error');
    }
  };
})();
