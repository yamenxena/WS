/* ══════════════════════════════════════════════════════════════
   Concept Plans Page — (SD) to-do checklist from Notion
   ══════════════════════════════════════════════════════════════ */
(function () {
  let loaded = false;

  window.addEventListener('viewChange', (e) => {
    if (e.detail.view === 'concept-plans' && !loaded) window.loadConceptPlans();
  });

  window.loadConceptPlans = async function () {
    if (loaded) return;
    const container = document.getElementById('concept-plans-view');
    if (!container) return;

    container.innerHTML = `
      <div class="view-header">
        <span class="view-title">Concept Plans</span>
      </div>
      <div class="filter-bar" style="margin:16px 0">
        <input class="filter-input" id="cp-search" placeholder="Search plans..." oninput="filterConceptPlans()" />
        <select class="filter-select" id="cp-filter" onchange="filterConceptPlans()">
          <option value="all">All</option>
          <option value="done">✅ Done</option>
          <option value="pending">⬜ Pending</option>
        </select>
      </div>
      <div id="cp-list" style="display:flex;flex-direction:column;gap:8px">
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-card"></div>
      </div>`;

    try {
      const res = await API.conceptPlans();
      const plans = res?.rows || [];
      loaded = true;
      window._conceptPlans = plans;
      renderConceptPlans(plans);
    } catch (e) {
      document.getElementById('cp-list').innerHTML =
        `<div style="padding:24px;color:var(--text-muted);text-align:center">
          ⚠️ Could not load concept plans<br><small>${e.message || ''}</small>
        </div>`;
    }
  };

  function renderConceptPlans(plans) {
    const list = document.getElementById('cp-list');
    if (!plans.length) {
      list.innerHTML = `<div style="padding:24px;color:var(--text-muted);text-align:center">No concept plans found</div>`;
      return;
    }

    const doneCount = plans.filter(p => p.done).length;
    const pct = Math.round((doneCount / plans.length) * 100);

    list.innerHTML = `
      <div class="glass-card" style="padding:16px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="color:var(--text-muted);font-size:0.8rem">Progress</span>
          <span style="color:var(--gold);font-weight:600">${doneCount}/${plans.length} (${pct}%)</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>
      ${plans.map((p, i) => `
        <div class="glass-card concept-item ${p.done ? 'concept-done' : ''}" style="padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer" data-idx="${i}">
          <span style="font-size:1.3rem;flex-shrink:0">${p.done ? '✅' : '⬜'}</span>
          <div style="flex:1;min-width:0">
            <div style="color:${p.done ? 'var(--text-muted)' : 'var(--text-primary)'};${p.done ? 'text-decoration:line-through;' : ''}font-weight:500">
              ${p.name || 'Untitled'}
            </div>
            <div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px">
              Created: ${p.created ? new Date(p.created).toLocaleDateString() : '—'}
              ${p.days_since != null ? ` · ${p.days_since} days ago` : ''}
            </div>
          </div>
        </div>
      `).join('')}`;
  }

  window.filterConceptPlans = function () {
    const q = (document.getElementById('cp-search')?.value || '').toLowerCase();
    const f = document.getElementById('cp-filter')?.value || 'all';
    let plans = window._conceptPlans || [];
    if (q) plans = plans.filter(p => (p.name || '').toLowerCase().includes(q));
    if (f === 'done') plans = plans.filter(p => p.done);
    if (f === 'pending') plans = plans.filter(p => !p.done);
    renderConceptPlans(plans);
  };
})();
