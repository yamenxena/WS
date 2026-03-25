/**
 * Majaz CRM — Interactions Page v4.0.0
 * Side-peek detail view for interaction records.
 */
(() => {
  let interactionsData = [];
  let loaded = false;
  let lastFetchTime = 0;

  window.addEventListener('viewChange', (e) => {
    if (e.detail.view === 'interactions') {
      if (!loaded || (Date.now() - lastFetchTime > 60000)) loadInteractions();
    }
  });

  window.refreshInteractions = function() { loaded = false; loadInteractions(); };

  async function loadInteractions() {
    loaded = true;
    lastFetchTime = Date.now();
    const res = await API.interactions();
    if (!res) return;
    interactionsData = res.rows || [];
    const badge = document.getElementById('badge-interactions');
    if (badge) badge.textContent = interactionsData.length;
    renderTable(interactionsData);

    document.getElementById('interactions-search')?.addEventListener('input', () => {
      const q = (document.getElementById('interactions-search')?.value || '').toLowerCase();
      const filtered = q ? interactionsData.filter(i =>
        (i.name||'').toLowerCase().includes(q) || (i.summary||'').toLowerCase().includes(q) || (i.type||'').toLowerCase().includes(q)
      ) : interactionsData;
      renderTable(filtered);
    });
  }

  function renderTable(rows) {
    const el = document.getElementById('interactions-content');
    if (!rows.length) {
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i data-lucide="message-circle" style="width:48px;height:48px;opacity:0.4"></i></div><div class="empty-state-text">No interactions found</div><div class="empty-state-sub">Log calls, meetings, and emails from the client detail view</div></div>';
      if (window.lucide) lucide.createIcons();
      return;
    }

    el.innerHTML = `<div class="glass-card"><div class="data-table-wrap"><table class="data-table">
      <thead><tr>
        <th>Interaction</th><th>Type</th><th>Date</th><th>Summary</th><th>Logged By</th>
      </tr></thead>
      <tbody>${rows.map(i => `<tr style="cursor:pointer" onclick="showInteraction('${i.id}')">
        <td style="color:var(--text-primary);font-weight:500">${i.name || '—'}</td>
        <td><span class="status-badge status-as">${i.type || '—'}</span></td>
        <td class="mono">${i.date || '—'}</td>
        <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${i.summary || '—'}</td>
        <td>${(i.logged_by||[]).join(', ') || '—'}</td>
      </tr>`).join('')}</tbody>
    </table></div></div>`;
  }

  window.showInteraction = function(id) {
    const i = interactionsData.find(x => x.id === id);
    if (!i) return;
    openSidePeek(`<span style="color:var(--gold)">${i.name || 'Interaction'}</span>`, `
      <details class="peek-section" open>
        <summary>Interaction Details</summary>
        <div class="peek-section-body">
          <div class="peek-row"><span class="peek-label">Name</span><span style="font-weight:500">${i.name || '—'}</span></div>
          <div class="peek-row"><span class="peek-label">Type</span><span class="status-badge status-as">${i.type || '—'}</span></div>
          <div class="peek-row"><span class="peek-label">Date</span><span class="mono">${i.date || '—'}</span></div>
          ${(i.logged_by||[]).length ? `<div class="peek-row"><span class="peek-label">Logged By</span><span>${i.logged_by.join(', ')}</span></div>` : ''}
        </div>
      </details>
      ${i.summary ? `
      <details class="peek-section" open>
        <summary>Summary</summary>
        <div class="peek-section-body">
          <div style="line-height:1.6;color:var(--text-secondary)">${i.summary}</div>
        </div>
      </details>` : ''}
      ${i.next_steps ? `
      <details class="peek-section" open>
        <summary>Next Steps</summary>
        <div class="peek-section-body">
          <div style="color:var(--gold);line-height:1.6">${i.next_steps}</div>
        </div>
      </details>` : ''}
      <details class="peek-section" ${(i.client_ids||[]).length || (i.project_ids||[]).length ? 'open' : ''}>
        <summary>Links</summary>
        <div class="peek-section-body">
          ${(i.client_ids||[]).length
            ? i.client_ids.map(cid => `<div class="peek-row" style="color:var(--gold);cursor:pointer" onclick="showClient('${cid}')">View client →</div>`).join('')
            : ''}
          ${(i.project_ids||[]).length
            ? i.project_ids.map(pid => `<div class="peek-row" style="color:var(--gold);cursor:pointer" onclick="showProject('${pid}')">View project →</div>`).join('')
            : ''}
          ${!(i.client_ids||[]).length && !(i.project_ids||[]).length ? '<div style="color:var(--text-muted)">No linked records</div>' : ''}
        </div>
      </details>
    `);
  };
})();
