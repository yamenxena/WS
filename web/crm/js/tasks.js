/**
 * Majaz CRM — Tasks Page (Board + List)
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
    const res = await API.tasks();
    if (!res) return;
    tasksData = res.rows || [];

    document.getElementById('tasks-search')?.addEventListener('input', render);
    document.getElementById('tasks-filter-status')?.addEventListener('change', render);

    render();
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

  function renderBoard(el, rows) {
    const columns = [
      { key: 'Not started', label: 'Not Started', color: 'var(--text-muted)' },
      { key: 'In progress', label: 'In Progress', color: 'var(--info)' },
      { key: 'Done', label: 'Done', color: 'var(--success)' },
    ];

    el.innerHTML = `<div class="kanban">${columns.map(col => {
      const cards = rows.filter(t => t.status === col.key);
      return `<div class="kanban-column" style="flex:1;max-width:none">
        <div class="kanban-col-header">
          <span class="kanban-col-title" style="color:${col.color}">${col.label}</span>
          <span class="kanban-col-count">${cards.length}</span>
        </div>
        <div class="kanban-cards">${cards.map(t => `
          <div class="kanban-card">
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

  function renderList(el, rows) {
    el.innerHTML = `<div class="glass-card"><div class="data-table-wrap"><table class="data-table">
      <thead><tr>
        <th>Task</th><th>Status</th><th>Due Date</th><th>Duration</th><th>Assigned To</th>
      </tr></thead>
      <tbody>${rows.map(t => `<tr>
        <td style="color:var(--text-primary);font-weight:500">${t.name}</td>
        <td><span class="status-badge ${t.status==='Done'?'status-done':t.status==='In progress'?'status-dd':''}">${t.status||'—'}</span></td>
        <td class="mono">${t.due_date||'—'}</td>
        <td>${t.duration ? t.duration+'d' : '—'}</td>
        <td>${(t.assigned_to||[]).join(', ')||'—'}</td>
      </tr>`).join('')}</tbody>
    </table></div></div>`;
  }
})();
