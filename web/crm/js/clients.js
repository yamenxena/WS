/**
 * Majaz CRM — Clients Page (Full-Property Rendering)
 * Shows all 27 Notion properties in table + detail panel.
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

    // Search + filter
    document.getElementById('clients-search')?.addEventListener('input', applyFilters);
    document.getElementById('clients-filter-location')?.addEventListener('change', applyFilters);
  }

  function applyFilters() {
    const q = (document.getElementById('clients-search')?.value || '').toLowerCase();
    const loc = document.getElementById('clients-filter-location')?.value || '';
    let filtered = clientsData;
    if (q) filtered = filtered.filter(c => c.name.toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q) || (c.phone||'').includes(q));
    if (loc) filtered = filtered.filter(c => c.location === loc);
    renderTable(filtered);
  }

  function urgencyIcon(u) {
    if (!u) return '';
    if (u === '🔴' || u === 'High') return '<span title="High Urgency" style="font-size:1rem">🔴</span>';
    if (u === '🟡' || u === 'Medium') return '<span title="Medium Urgency" style="font-size:1rem">🟡</span>';
    if (u === '🟢' || u === 'Low') return '<span title="Low Urgency" style="font-size:1rem">🟢</span>';
    return `<span>${u}</span>`;
  }

  function fmtCurrency(val) {
    if (val == null) return '—';
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(val);
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
        <th>ICP</th><th>Lead Status</th><th>Urgency</th><th>Budget</th>
        <th>Phone</th><th>Email</th><th>Projects</th>
      </tr></thead>
      <tbody>${rows.map(c => `<tr style="cursor:pointer" onclick="showClient('${c.id}')">
        <td style="color:var(--text-primary);font-weight:500">${c.name}</td>
        <td>${c.location || '—'}</td>
        <td>${c.project_type || '—'}</td>
        <td>${c.service_interest || '—'}</td>
        <td>${c.icp_score || '—'}</td>
        <td><span class="status-badge ${stageClass(c.lead_status)}">${c.lead_status || '—'}</span></td>
        <td style="text-align:center">${urgencyIcon(c.urgency)}</td>
        <td class="mono" style="color:var(--gold)">${c.budget != null ? fmtCurrency(c.budget) : '—'}</td>
        <td class="mono">${c.phone || '—'}</td>
        <td>${c.email || '—'}</td>
        <td style="color:var(--gold);text-align:center">${(c.project_ids||[]).length || '—'}</td>
      </tr>`).join('')}</tbody>
    </table></div></div>`;
  }

  window.showClient = async function(id) {
    const c = await API.client(id);
    if (!c) return;

    openDetail(c.name, `
      <!-- ── Contact ── -->
      <div class="detail-section"><div class="detail-label">📞 Contact</div>
        <div class="detail-value">Phone: <span class="mono">${c.phone || '—'}</span></div>
        ${c.phone_1 ? `<div class="detail-value">Phone 2: <span class="mono">${c.phone_1}</span></div>` : ''}
        <div class="detail-value">Email: ${c.email || '—'}</div>
        <div class="detail-value">Channel: ${c.preferred_channel || '—'}</div>
        <div class="detail-value">Language: ${c.preferred_language || '—'}</div>
      </div>

      <!-- ── Profile ── -->
      <div class="detail-section"><div class="detail-label">🏢 Profile</div>
        <div class="detail-value">Location: ${c.location || '—'}</div>
        <div class="detail-value">Project Type: ${c.project_type || '—'}</div>
        <div class="detail-value">Service Interest: ${c.service_interest || '—'}</div>
        <div class="detail-value">ICP Score: <strong style="color:var(--gold)">${c.icp_score || '—'}</strong></div>
        <div class="detail-value">Lead Source: ${c.lead_source || '—'}</div>
        ${(c.nation||[]).length ? `<div class="detail-value">Nation: ${c.nation.join(', ')}</div>` : ''}
      </div>

      <!-- ── Business ── -->
      <div class="detail-section"><div class="detail-label">💰 Business</div>
        <div class="detail-value">Budget: <span class="mono" style="color:var(--gold)">${c.budget != null ? fmtCurrency(c.budget) : '—'}</span></div>
        <div class="detail-value">CLV: <span class="mono" style="color:var(--gold)">${c.clv != null ? fmtCurrency(c.clv) : '—'}</span></div>
        <div class="detail-value">Active Projects: <strong>${c.active_projects ?? '—'}</strong></div>
        ${Array.isArray(c.project_s_num) && c.project_s_num.length ? `<div class="detail-value">Project #s: ${c.project_s_num.join(', ')}</div>` : ''}
      </div>

      <!-- ── Lead Status ── -->
      <div class="detail-section"><div class="detail-label">📊 Status</div>
        <div class="detail-value">Lead Status: <span class="status-badge ${stageClass(c.lead_status)}">${c.lead_status || '—'}</span></div>
        <div class="detail-value">Urgency: ${urgencyIcon(c.urgency) || '—'} ${c.overdue_alert ? `<span style="color:var(--danger);margin-left:8px">${c.overdue_alert}</span>` : ''}</div>
        ${c.due_date ? `<div class="detail-value">Due Date: <span class="mono">${c.due_date}</span></div>` : ''}
        <div class="detail-value">Days Since Contact: <span class="mono" style="color:${c.days_since_contact > 30 ? 'var(--danger)' : 'var(--text-muted)'}">${c.days_since_contact ?? '—'} days</span></div>
        ${c.last_contacted ? `<div class="detail-value">Last Contacted: <span class="mono">${c.last_contacted}</span></div>` : ''}
      </div>

      <!-- ── Actions ── -->
      <div class="detail-section"><div class="detail-label">🎯 Actions</div>
        ${c.next_action ? `<div class="detail-value" style="color:var(--gold)">Next: ${c.next_action}</div>` : '<div class="detail-value" style="color:var(--text-muted)">No next action set</div>'}
        ${c.representative ? `<div class="detail-value">Representative: ${c.representative}</div>` : ''}
        ${c.referred_by ? `<div class="detail-value">Referred By: ${c.referred_by}</div>` : ''}
        ${(c.assigned_to||[]).length ? `<div class="detail-value">Assigned To: ${c.assigned_to.join(', ')}</div>` : ''}
        ${c.lost_reason ? `<div class="detail-value" style="color:var(--danger)">Lost Reason: ${c.lost_reason}</div>` : ''}
      </div>

      <!-- ── Linked Projects ── -->
      <div class="detail-section"><div class="detail-label">📐 Projects (${(c.project_ids||[]).length})</div>
        ${(c.project_ids||[]).length ? c.project_ids.map(pid =>
          `<div class="detail-value" style="color:var(--gold);cursor:pointer" onclick="showProject('${pid}')">🔗 View project →</div>`
        ).join('') : '<div class="detail-value" style="color:var(--text-muted)">No linked projects</div>'}
      </div>

      <!-- ── Interactions ── -->
      ${(c.interactions||[]).length ? `
      <div class="detail-section"><div class="detail-label">💬 Interactions (${c.interactions.length})</div>
        ${c.interactions.map(i => `<div style="padding:8px 0;border-bottom:1px solid var(--glass-border)">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-weight:500;color:var(--text-primary)">${i.name}</span>
            <span class="status-badge" style="font-size:0.6rem">${i.type||''}</span>
          </div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">📅 ${i.date||'—'} ${(i.logged_by||[]).length ? `· 👤 ${i.logged_by.join(', ')}` : ''}</div>
          ${i.summary ? `<div style="font-size:0.8rem;color:var(--text-secondary);margin-top:4px">${i.summary}</div>` : ''}
          ${i.next_steps ? `<div style="font-size:0.8rem;color:var(--gold);margin-top:4px">→ ${i.next_steps}</div>` : ''}
        </div>`).join('')}
      </div>` : ''}

      <!-- ── Meta ── -->
      <div class="detail-section" style="opacity:0.5"><div class="detail-label">Meta</div>
        <div class="detail-value" style="font-size:0.7rem">Created: ${c.created || '—'}</div>
      </div>
    `);
  };
})();
