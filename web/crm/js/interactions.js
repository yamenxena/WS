/**
 * Majaz CRM — Interactions Page
 * Renders all interaction records from Notion with type, summary, next steps.
 */
(() => {
  let interactionsData = [];
  let loaded = false;

  window.addEventListener('viewChange', (e) => {
    if (e.detail.view === 'interactions' && !loaded) loadInteractions();
  });

  async function loadInteractions() {
    loaded = true;
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
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💬</div><div class="empty-state-text">No interactions found</div></div>';
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
    openDetail(i.name || 'Interaction', `
      <div class="detail-section"><div class="detail-label">💬 Interaction Details</div>
        <div class="detail-value">Name: <strong style="color:var(--text-primary)">${i.name || '—'}</strong></div>
        <div class="detail-value">Type: <span class="status-badge status-as">${i.type || '—'}</span></div>
        <div class="detail-value">Date: <span class="mono">${i.date || '—'}</span></div>
        ${(i.logged_by||[]).length ? `<div class="detail-value">Logged By: ${i.logged_by.join(', ')}</div>` : ''}
      </div>
      ${i.summary ? `<div class="detail-section"><div class="detail-label">📝 Summary</div>
        <div class="detail-value" style="line-height:1.6">${i.summary}</div>
      </div>` : ''}
      ${i.next_steps ? `<div class="detail-section"><div class="detail-label">🎯 Next Steps</div>
        <div class="detail-value" style="color:var(--gold);line-height:1.6">${i.next_steps}</div>
      </div>` : ''}
      <div class="detail-section"><div class="detail-label">🔗 Links</div>
        ${(i.client_ids||[]).length
          ? i.client_ids.map(cid => `<div class="detail-value" style="color:var(--gold);cursor:pointer" onclick="showClient('${cid}')">👥 View client →</div>`).join('')
          : ''}
        ${(i.project_ids||[]).length
          ? i.project_ids.map(pid => `<div class="detail-value" style="color:var(--gold);cursor:pointer" onclick="showProject('${pid}')">📐 View project →</div>`).join('')
          : ''}
        ${!(i.client_ids||[]).length && !(i.project_ids||[]).length ? '<div class="detail-value" style="color:var(--text-muted)">No linked records</div>' : ''}
      </div>
    `);
  };
})();
