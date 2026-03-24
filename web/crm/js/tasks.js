/**
 * Majaz CRM — Tasks Page (Board + List + Write-Back)
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

  function statusColor(s) {
    if (s === 'Done') return 'status-done';
    if (s === 'In progress') return 'status-dd';
    return '';
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
          <div class="kanban-card" onclick="showTaskDetail('${t.id}')">
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

      <div id="task-save-feedback" style="margin-top:12px;font-size:0.8rem;display:none"></div>
    `);

    document.getElementById('task-save-status')?.addEventListener('click', async () => {
      const newStatus = document.getElementById('task-status-select').value;
      const feedback = document.getElementById('task-save-feedback');
      feedback.style.display = 'block';
      feedback.style.color = 'var(--text-muted)';
      feedback.textContent = '⏳ Saving to Notion...';

      const result = await API.updateTask(id, { status: newStatus });
      if (result && !result.error) {
        feedback.style.color = 'var(--success)';
        feedback.textContent = '✅ Status updated in Notion!';
        t.status = newStatus;
        setTimeout(() => render(), 1000);
      } else {
        feedback.style.color = 'var(--danger)';
        feedback.textContent = '❌ Failed to save';
      }
    });
  };

  window.markTaskDone = async function(id, name) {
    const result = await API.updateTask(id, { status: 'Done' });
    if (result && !result.error) {
      const t = tasksData.find(ts => ts.id === id);
      if (t) t.status = 'Done';
      render();
    }
  };
})();
