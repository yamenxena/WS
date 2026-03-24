/**
 * Majaz CRM — Clients Page
 */
(() => {
  let clientsData = [];
  let loaded = false;

  window.addEventListener('viewChange', (e) => {
    if (e.detail.view === 'clients' && !loaded) loadClients();
  });

  async function loadClients() {
    loaded = true;
    const res = await API.clients();
    if (!res) return;
    clientsData = res.rows || [];
    renderTable(clientsData);

    // Populate location filter
    const locations = [...new Set(clientsData.map(c => c.location).filter(Boolean))].sort();
    const locSelect = document.getElementById('clients-filter-location');
    locations.forEach(loc => {
      const opt = document.createElement('option');
      opt.value = loc; opt.textContent = loc;
      locSelect.appendChild(opt);
    });

    // Search
    document.getElementById('clients-search')?.addEventListener('input', applyFilters);
    document.getElementById('clients-filter-location')?.addEventListener('change', applyFilters);
  }

  function applyFilters() {
    const q = (document.getElementById('clients-search')?.value || '').toLowerCase();
    const loc = document.getElementById('clients-filter-location')?.value || '';
    let filtered = clientsData;
    if (q) filtered = filtered.filter(c => c.name.toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q));
    if (loc) filtered = filtered.filter(c => c.location === loc);
    renderTable(filtered);
  }

  function renderTable(rows) {
    const el = document.getElementById('clients-content');
    if (!rows.length) {
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👥</div><div class="empty-state-text">No clients found</div></div>';
      return;
    }

    el.innerHTML = `<div class="glass-card"><div class="data-table-wrap"><table class="data-table">
      <thead><tr>
        <th>Name</th><th>Location</th><th>Type</th><th>Service</th>
        <th>ICP</th><th>Status</th><th>Phone</th><th>Projects</th>
      </tr></thead>
      <tbody>${rows.map(c => `<tr style="cursor:pointer" onclick="showClient('${c.id}')">
        <td style="color:var(--text-primary);font-weight:500">${c.name}</td>
        <td>${c.location || '—'}</td>
        <td>${c.project_type || '—'}</td>
        <td>${c.service_interest || '—'}</td>
        <td>${c.icp_score || '—'}</td>
        <td><span class="status-badge ${stageClass(c.lead_status)}">${c.lead_status || '—'}</span></td>
        <td class="mono">${c.phone || '—'}</td>
        <td style="color:var(--gold)">${(c.project_ids||[]).length}</td>
      </tr>`).join('')}</tbody>
    </table></div></div>`;
  }

  window.showClient = async function(id) {
    const c = await API.client(id);
    if (!c) return;
    openDetail(c.name, `
      <div class="detail-section"><div class="detail-label">Contact</div>
        <div class="detail-value">📞 ${c.phone || '—'}</div>
        <div class="detail-value">📧 ${c.email || '—'}</div>
        <div class="detail-value">📍 ${c.location || '—'}</div>
      </div>
      <div class="detail-section"><div class="detail-label">Profile</div>
        <div class="detail-value">Type: ${c.project_type || '—'}</div>
        <div class="detail-value">ICP: ${c.icp_score || '—'}</div>
        <div class="detail-value">Source: ${c.lead_source || '—'}</div>
        <div class="detail-value">Language: ${c.preferred_language || '—'}</div>
        <div class="detail-value">Channel: ${c.preferred_channel || '—'}</div>
      </div>
      <div class="detail-section"><div class="detail-label">Linked Projects (${(c.project_ids||[]).length})</div>
        <div class="detail-value">${(c.project_ids||[]).length ? 'See Projects tab' : 'None'}</div>
      </div>
      ${(c.interactions||[]).length ? `
      <div class="detail-section"><div class="detail-label">Interactions (${c.interactions.length})</div>
        ${c.interactions.map(i => `<div style="padding:8px 0;border-bottom:1px solid var(--glass-border)">
          <div style="font-weight:500;color:var(--text-primary)">${i.name}</div>
          <div style="font-size:0.75rem;color:var(--text-muted)">${i.type||''} · ${i.date||''}</div>
          <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:4px">${i.summary||''}</div>
        </div>`).join('')}
      </div>` : ''}
    `);
  };
})();
