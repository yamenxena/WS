/**
 * Majaz CRM — Admin Power Tools v4.0.0
 * Activity Log · Column Visibility · Archive
 * Admin-only. Guarded by isAdmin() check at load time.
 */
(() => {
  if (!API.isAdmin()) return; // Hard guard — team users get nothing

  // Listen for view navigation
  window.addEventListener('viewChange', (e) => {
    if (e.detail.view === 'admin-settings') loadAdminSettings();
  });

  // ══════════════════════════════════════════════════════
  // COLUMN VISIBILITY — persisted to localStorage
  // ══════════════════════════════════════════════════════

  const COL_STORAGE_KEY = 'majaz_col_visibility';

  // Default visibility config per table
  const DEFAULT_COLS = {
    clients:  ['name','location','type','service','icp','status','urgency','budget','projects'],
    projects: ['name','sn','stage','service','value','fab','pct','assignee'],
    tasks:    ['name','status','due','duration','project','assigned'],
  };

  function loadColPrefs() {
    try {
      return JSON.parse(localStorage.getItem(COL_STORAGE_KEY) || '{}');
    } catch { return {}; }
  }

  function saveColPrefs(prefs) {
    localStorage.setItem(COL_STORAGE_KEY, JSON.stringify(prefs));
  }

  // Apply stored column prefs to a rendered table
  window.applyColVisibility = function(tableId, tableKey) {
    const prefs = loadColPrefs()[tableKey];
    if (!prefs) return; // No custom prefs — show all
    const table = document.getElementById(tableId);
    if (!table) return;
    table.querySelectorAll('[data-col]').forEach(el => {
      const col = el.dataset.col;
      if (col && prefs[col] === false) {
        el.style.display = 'none';
      }
    });
  };

  // ══════════════════════════════════════════════════════
  // ARCHIVE — Soft-delete via Notion in_trash
  // ══════════════════════════════════════════════════════

  window.archiveRecord = async function(type, id, name) {
    const confirmed = await showConfirmDialog(
      `Archive "${name}"?`,
      `This will move the record to trash in Notion. It can be restored from Notion directly.`,
      'Archive',
      'danger'
    );
    if (!confirmed) return;

    let result;
    showToast(`Archiving ${name}...`, 'info');
    if (type === 'client')  result = await API.updateClient(id,  { archived: true });
    if (type === 'project') result = await API.updateProject(id, { archived: true });
    if (type === 'task')    result = await API.updateTask(id,    { archived: true });

    if (result && result.ok) {
      showToast(`"${name}" archived in Notion`, 'success');
      closeSidePeek();
      // Reload the appropriate view
      if (type === 'client')  { window._clientsLoaded = false; window.loadClients?.(); }
      if (type === 'project') { window._projectsLoaded = false; window.loadProjects?.(); }
      if (type === 'task')    { window._tasksLoaded = false;    window.loadTasks?.(); }
    } else {
      showToast('Archive failed', 'error');
    }
  };

  // ══════════════════════════════════════════════════════
  // CONFIRM DIALOG — dark themed, reusable
  // ══════════════════════════════════════════════════════

  function showConfirmDialog(title, message, actionLabel = 'Confirm', variant = 'danger') {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'confirm-overlay';
      overlay.innerHTML = `
        <div class="confirm-dialog">
          <h3 class="confirm-title">${title}</h3>
          <p class="confirm-msg">${message}</p>
          <div class="confirm-actions">
            <button class="btn btn-ghost" id="conf-cancel">Cancel</button>
            <button class="btn btn-${variant === 'danger' ? 'danger' : 'primary'}" id="conf-ok">${actionLabel}</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#conf-cancel').addEventListener('click', () => { overlay.remove(); resolve(false); });
      overlay.querySelector('#conf-ok').addEventListener('click',    () => { overlay.remove(); resolve(true); });
    });
  }

  // ══════════════════════════════════════════════════════
  // ACTIVITY LOG — aggregated from last_edited_time
  // ══════════════════════════════════════════════════════

  async function loadActivityLog() {
    const container = document.getElementById('activity-log-list');
    if (!container) return;
    container.innerHTML = '<div class="spinner"></div>';

    const data = await API.activity();
    const entries = data?.rows || [];

    if (!entries.length) {
      container.innerHTML = '<div style="color:var(--text-muted);padding:16px">No recent activity</div>';
      return;
    }

    container.innerHTML = entries.map(e => `
      <div class="activity-item">
        <span class="activity-icon">${e.icon}</span>
        <div class="activity-body">
          <div class="activity-name">${e.name || '—'}</div>
          <div class="activity-meta">${e.type} · ${e.date || '—'}</div>
        </div>
      </div>
    `).join('');
  }

  // ══════════════════════════════════════════════════════
  // SETTINGS VIEW — Column Toggles + Activity Log
  // ══════════════════════════════════════════════════════

  window.loadAdminSettings = function() {
    const prefs = loadColPrefs();

    const colSections = Object.entries(DEFAULT_COLS).map(([table, cols]) => {
      const tablePrefs = prefs[table] || {};
      return `
        <div class="settings-section">
          <div class="settings-section-title">${table.charAt(0).toUpperCase() + table.slice(1)} Columns</div>
          <div class="settings-toggles">
            ${cols.map(col => {
              const visible = tablePrefs[col] !== false;
              return `<label class="col-toggle">
                <input type="checkbox" data-table="${table}" data-col="${col}" ${visible ? 'checked' : ''} />
                <span>${col}</span>
              </label>`;
            }).join('')}
          </div>
        </div>`;
    }).join('');

    const container = document.getElementById('admin-settings-content');
    if (!container) return;

    container.innerHTML = `
      <div class="settings-panel">

        <!-- Column Visibility -->
        <details class="peek-section" open>
          <summary>Table Column Visibility</summary>
          <div class="peek-section-body">
            <p style="color:var(--text-muted);font-size:0.8rem;margin-bottom:16px">
              Toggle which columns appear in tables. Changes are saved instantly to your browser.
            </p>
            ${colSections}
            <button class="btn btn-primary btn-sm" id="btn-reset-cols" style="margin-top:12px">
              ↺ Reset to defaults
            </button>
          </div>
        </details>

        <!-- Activity Log -->
        <details class="peek-section" open>
          <summary>Recent Activity (Last 50 records)</summary>
          <div class="peek-section-body">
            <div id="activity-log-list"><div class="spinner"></div></div>
          </div>
        </details>

      </div>`;

    // Wire up column toggles — save on change
    container.querySelectorAll('input[type="checkbox"][data-col]').forEach(cb => {
      cb.addEventListener('change', () => {
        const p = loadColPrefs();
        const table = cb.dataset.table;
        if (!p[table]) p[table] = {};
        p[table][cb.dataset.col] = cb.checked;
        saveColPrefs(p);
        showToast('Column preference saved', 'success');
      });
    });

    // Reset
    container.querySelector('#btn-reset-cols')?.addEventListener('click', () => {
      localStorage.removeItem(COL_STORAGE_KEY);
      showToast('Column preferences reset', 'success');
      loadAdminSettings();
    });

    // Load activity log
    loadActivityLog();
  };

})();
