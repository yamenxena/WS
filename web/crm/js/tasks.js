/**
 * Majaz CRM — Tasks Page (Board + List + Write-Back + Toasts)
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

  function statusColor(s) {
    if (s === 'Done') return 'status-done';
    if (s === 'In progress') return 'status-dd';
    if (s === 'Sent to Client') return 'status-as';
    return '';
  }

  function renderBoard(el, rows) {
    const columns = [
      { key: 'Not started', label: 'Not Started', color: 'var(--text-muted)' },
      { key: 'In progress', label: 'In Progress', color: 'var(--info)' },
      { key: 'Done', label: 'Done', color: 'var(--success)' },
    ];

    el.innerHTML = `<div class="kanban">${columns.map((col, i) => {
      const cards = rows.filter(t => t.status === col.key);
      return `<div class="kanban-column stagger-in" style="flex:1;max-width:none" data-status="${col.key}"
        ondragover="event.preventDefault();this.classList.add('drag-over');this.querySelector('.kanban-cards').classList.add('drag-over')"
        ondragleave="this.classList.remove('drag-over');this.querySelector('.kanban-cards').classList.remove('drag-over')"
        ondrop="handleTaskDrop(event,'${col.key}');this.classList.remove('drag-over');this.querySelector('.kanban-cards').classList.remove('drag-over')">
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
        <th>Task</th><th>Status</th><th>Due Date</th><th>Duration</th><th>Assigned To</th><th>Action</th>
      </tr></thead>
      <tbody>${rows.map(t => `<tr>
        <td style="color:var(--text-primary);font-weight:500;cursor:pointer" onclick="showTaskDetail('${t.id}')">${t.name}</td>
        <td><span class="status-badge ${statusColor(t.status)}">${t.status||'—'}</span></td>
        <td class="mono">${t.due_date||'—'}</td>
        <td>${t.duration ? t.duration+'d' : '—'}</td>
        <td>${(t.assigned_to||[]).join(', ')||'—'}</td>
        <td>
          ${t.status !== 'Done' ? `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();markTaskDone('${t.id}','${t.name.replace(/'/g,"\\'")}')">✅ Done</button>` : '<span style="color:var(--success)">✓</span>'}
        </td>
      </tr>`).join('')}</tbody>
    </table></div></div>`;
  }

  window.showTaskDetail = function(id) {
    const t = tasksData.find(ts => ts.id === id);
    if (!t) return;
    const statuses = ['Not started', 'In progress', 'Done'];

    openDetail(t.name, `
      <div class="detail-section"><div class="detail-label">Status</div>
        <div style="display:flex;align-items:center;gap:8px">
          <select class="filter-select" id="task-status-select" style="padding:4px 8px;font-size:0.8rem">
            ${statuses.map(s => `<option value="${s}" ${t.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
          <button class="btn btn-primary btn-sm" id="task-save-status" style="font-size:0.7rem">Save ↗</button>
        </div>
      </div>
      <div class="detail-section"><div class="detail-label">Details</div>
        ${t.due_date ? `<div class="detail-value">📅 Due: ${t.due_date}</div>` : ''}
        ${t.duration ? `<div class="detail-value">⏱ Duration: ${t.duration} days</div>` : ''}
        ${(t.assigned_to||[]).length ? `<div class="detail-value">👤 Assigned: ${t.assigned_to.join(', ')}</div>` : ''}
        <div class="detail-value">Created: ${t.created || '—'}</div>
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
})();
