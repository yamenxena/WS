/**
 * Majaz CRM — Clients Page (Full-Property Rendering + Write-Back)
 * Shows all 27 Notion properties in table + detail panel.
 * Supports: edit next_action/budget/phone/email/location, add client, add interaction.
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

  // ── Add Client Modal ──
  window.showAddClientForm = function() {
    openDetail('➕ New Client', `
      <div class="detail-section">
        <div class="detail-label">Client Information</div>
        <label style="display:block;margin:8px 0 4px;color:var(--text-muted);font-size:0.75rem">Name *</label>
        <input id="new-client-name" class="filter-input" style="width:100%;margin-bottom:8px" placeholder="Client name" />
        <label style="display:block;margin:8px 0 4px;color:var(--text-muted);font-size:0.75rem">Phone</label>
        <input id="new-client-phone" class="filter-input" style="width:100%;margin-bottom:8px" placeholder="+971..." />
        <label style="display:block;margin:8px 0 4px;color:var(--text-muted);font-size:0.75rem">Email</label>
        <input id="new-client-email" class="filter-input" style="width:100%;margin-bottom:8px" placeholder="email@domain.com" />
        <label style="display:block;margin:8px 0 4px;color:var(--text-muted);font-size:0.75rem">Location</label>
        <input id="new-client-location" class="filter-input" style="width:100%;margin-bottom:8px" placeholder="Abu Dhabi / Dubai / Al Ain..." />
        <label style="display:block;margin:8px 0 4px;color:var(--text-muted);font-size:0.75rem">Project Type</label>
        <input id="new-client-type" class="filter-input" style="width:100%;margin-bottom:8px" placeholder="Villa / Commercial / Residential..." />
        <label style="display:block;margin:8px 0 4px;color:var(--text-muted);font-size:0.75rem">Service Interest</label>
        <input id="new-client-service" class="filter-input" style="width:100%;margin-bottom:16px" placeholder="Design / Supervision / Both" />
        <button class="btn btn-primary" onclick="submitNewClient()" style="width:100%">Create Client → Notion</button>
      </div>
    `);
  };

  window.submitNewClient = async function() {
    const name = document.getElementById('new-client-name')?.value?.trim();
    if (!name) { showToast('Name is required', 'error'); return; }
    const data = {
      name,
      phone: document.getElementById('new-client-phone')?.value?.trim() || undefined,
      email: document.getElementById('new-client-email')?.value?.trim() || undefined,
      location: document.getElementById('new-client-location')?.value?.trim() || undefined,
      project_type: document.getElementById('new-client-type')?.value?.trim() || undefined,
      service_interest: document.getElementById('new-client-service')?.value?.trim() || undefined,
    };
    const res = await API.createClient(data);
    if (res && res.id) {
      showToast('Client created in Notion!', 'success');
      loaded = false;
      loadClients();
      document.getElementById('detail-close')?.click();
    } else {
      showToast('Failed to create client', 'error');
    }
  };

  // ── Show Client with Edit ──
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
      </div>

      <!-- ── Lead Status ── -->
      <div class="detail-section"><div class="detail-label">📊 Status</div>
        <div class="detail-value">Lead Status: <span class="status-badge ${stageClass(c.lead_status)}">${c.lead_status || '—'}</span></div>
        <div class="detail-value">Urgency: ${urgencyIcon(c.urgency) || '—'} ${c.overdue_alert ? `<span style="color:var(--danger);margin-left:8px">${c.overdue_alert}</span>` : ''}</div>
        ${c.due_date ? `<div class="detail-value">Due Date: <span class="mono">${c.due_date}</span></div>` : ''}
        <div class="detail-value">Days Since Contact: <span class="mono" style="color:${c.days_since_contact > 30 ? 'var(--danger)' : 'var(--text-muted)'}">${c.days_since_contact ?? '—'} days</span></div>
        ${c.last_contacted ? `<div class="detail-value">Last Contacted: <span class="mono">${c.last_contacted}</span></div>` : ''}
      </div>

      <!-- ── Editable: Quick Edit ── -->
      <div class="detail-section"><div class="detail-label">✏️ Quick Edit</div>
        <label style="display:block;margin:6px 0 3px;color:var(--text-muted);font-size:0.7rem">Lead Status</label>
        <select id="edit-lead-status" class="filter-select" style="width:100%;margin-bottom:8px">
          <option value="" ${!c.lead_status?'selected':''}>— Select —</option>
          ${['Inquiry','Qualified','Proposal','Negotiation','Won','Lost'].map(s => `<option value="${s}" ${c.lead_status===s?'selected':''}>${s}</option>`).join('')}
        </select>
        <label style="display:block;margin:6px 0 3px;color:var(--text-muted);font-size:0.7rem">Next Action</label>
        <input id="edit-next-action" class="filter-input" style="width:100%;margin-bottom:8px" value="${c.next_action || ''}" placeholder="Enter next action..." />
        <label style="display:block;margin:6px 0 3px;color:var(--text-muted);font-size:0.7rem">Budget (AED)</label>
        <input id="edit-budget" type="number" class="filter-input" style="width:100%;margin-bottom:12px" value="${c.budget || ''}" placeholder="Enter budget..." />
        <button class="btn btn-primary btn-sm" onclick="saveClientEdit('${c.id}')" style="width:100%">💾 Save to Notion</button>
      </div>

      <!-- ── Actions ── -->
      <div class="detail-section"><div class="detail-label">🎯 Info</div>
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

      <!-- ── Add Interaction ── -->
      <div class="detail-section"><div class="detail-label">➕ Log Interaction</div>
        <input id="new-int-name" class="filter-input" style="width:100%;margin-bottom:6px" placeholder="Interaction title..." />
        <select id="new-int-type" class="filter-select" style="width:100%;margin-bottom:6px">
          <option value="">Select type...</option>
          <option value="Meeting">Meeting</option>
          <option value="Call">Call</option>
          <option value="Email">Email</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="Site Visit">Site Visit</option>
        </select>
        <textarea id="new-int-summary" class="filter-input" style="width:100%;min-height:60px;margin-bottom:6px;resize:vertical" placeholder="Summary..."></textarea>
        <input id="new-int-next" class="filter-input" style="width:100%;margin-bottom:10px" placeholder="Next steps..." />
        <button class="btn btn-primary btn-sm" onclick="submitInteraction('${c.id}')" style="width:100%">📝 Log → Notion</button>
      </div>

      <!-- ── Interactions List ── -->
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

  // ── Save Client Edit ──
  window.saveClientEdit = async function(id) {
    const next_action = document.getElementById('edit-next-action')?.value?.trim() || '';
    const budgetVal = document.getElementById('edit-budget')?.value;
    const leadStatus = document.getElementById('edit-lead-status')?.value;
    const data = { next_action };
    if (budgetVal !== '' && budgetVal != null) data.budget = parseFloat(budgetVal);
    if (leadStatus) data.lead_status = leadStatus;
    const res = await API.updateClient(id, data);
    if (res?.ok) {
      showToast('Client updated in Notion!', 'success');
    } else {
      showToast('Failed to update client', 'error');
    }
  };

  // ── Submit Interaction ──
  window.submitInteraction = async function(clientId) {
    const name = document.getElementById('new-int-name')?.value?.trim();
    if (!name) { showToast('Interaction title is required', 'error'); return; }
    const data = {
      name,
      type: document.getElementById('new-int-type')?.value || undefined,
      date: new Date().toISOString().split('T')[0],
      summary: document.getElementById('new-int-summary')?.value?.trim() || undefined,
      next_steps: document.getElementById('new-int-next')?.value?.trim() || undefined,
      client_id: clientId,
    };
    const res = await API.createInteraction(data);
    if (res && res.id) {
      showToast('Interaction logged to Notion!', 'success');
      showClient(clientId); // refresh detail
    } else {
      showToast('Failed to log interaction', 'error');
    }
  };
})();
