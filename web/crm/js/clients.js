/**
 * Majaz CRM — Clients Page v4.0.0
 * Side-peek detail view with collapsible sections, full Notion property fidelity.
 * Supports: edit lead_status/next_action/budget, add client, add interaction.
 */
(() => {
  let clientsData = [];
  let loaded = false;
  let lastFetchTime = 0;

  window.addEventListener('viewChange', (e) => {
    if (e.detail.view === 'clients') {
      if (!loaded || (Date.now() - lastFetchTime > 60000)) loadClients();
    }
  });

  window.refreshClients = function() { loaded = false; loadClients(); };

  async function loadClients() {
    loaded = true;
    lastFetchTime = Date.now();
    const res = await API.clients();
    if (!res) return;
    clientsData = res.rows || [];
    renderTable(clientsData);

    // Populate location filter
    const locations = [...new Set(clientsData.map(c => c.location).filter(Boolean))].sort();
    const locSelect = document.getElementById('clients-filter-location');
    if (locSelect && locSelect.options.length <= 1) {
      locations.forEach(loc => {
        const opt = document.createElement('option');
        opt.value = loc; opt.textContent = loc;
        locSelect.appendChild(opt);
      });
    }

    // Populate lead status filter
    const leadSelect = document.getElementById('clients-filter-lead-status');
    if (leadSelect && leadSelect.options.length <= 1) {
      ['Inquiry','Qualified','Proposal','Negotiation','Won','Lost'].forEach(s => {
        const opt = document.createElement('option');
        opt.value = s; opt.textContent = s;
        leadSelect.appendChild(opt);
      });
    }

    // Populate ICP Score
    const icpSelect = document.getElementById('clients-filter-icp');
    if (icpSelect && icpSelect.options.length <= 1) {
      const icps = [...new Set(clientsData.map(c => c.icp_score).filter(Boolean))].sort((a,b)=>b-a);
      icps.forEach(icp => {
        const opt = document.createElement('option');
        opt.value = icp; opt.textContent = icp;
        icpSelect.appendChild(opt);
      });
    }

    // Populate Nation
    const nationSelect = document.getElementById('clients-filter-nation');
    if (nationSelect && nationSelect.options.length <= 1) {
      const nations = [...new Set(clientsData.map(c => c.nation).filter(Boolean))].sort();
      nations.forEach(n => {
        const opt = document.createElement('option');
        opt.value = n; opt.textContent = n;
        nationSelect.appendChild(opt);
      });
    }

    // Search + filter
    document.getElementById('clients-search')?.addEventListener('input', applyFilters);
    document.getElementById('clients-filter-location')?.addEventListener('change', applyFilters);
    document.getElementById('clients-filter-lead-status')?.addEventListener('change', applyFilters);
    document.getElementById('clients-filter-icp')?.addEventListener('change', applyFilters);
    document.getElementById('clients-filter-nation')?.addEventListener('change', applyFilters);
  }

  function applyFilters() {
    const q = (document.getElementById('clients-search')?.value || '').toLowerCase();
    const loc = document.getElementById('clients-filter-location')?.value || '';
    const lead = document.getElementById('clients-filter-lead-status')?.value || '';
    const icp = document.getElementById('clients-filter-icp')?.value || '';
    const nation = document.getElementById('clients-filter-nation')?.value || '';
    let filtered = clientsData;
    if (q) filtered = filtered.filter(c => c.name.toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q) || (c.phone||'').includes(q));
    if (loc) filtered = filtered.filter(c => c.location === loc);
    if (lead) filtered = filtered.filter(c => c.lead_status === lead);
    if (icp) filtered = filtered.filter(c => String(c.icp_score) === String(icp));
    if (nation) filtered = filtered.filter(c => c.nation === nation);
    renderTable(filtered);
  }

  function urgencyIcon(u) {
    if (!u) return '';
    if (u === '🔴' || u === 'High') return '<span class="urgency-dot urgency-high" title="High Urgency"></span> High';
    if (u === '🟡' || u === 'Medium') return '<span class="urgency-dot urgency-medium" title="Medium Urgency"></span> Medium';
    if (u === '🟢' || u === 'Low') return '<span class="urgency-dot urgency-low" title="Low Urgency"></span> Low';
    return `<span>${u}</span>`;
  }

  function fmtCurrency(val) {
    if (val == null) return '—';
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(val);
  }

  function renderTable(rows) {
    const el = document.getElementById('clients-content');
    if (!rows.length) {
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i data-lucide="users" style="width:48px;height:48px;opacity:0.4"></i></div><div class="empty-state-text">No clients found</div><div class="empty-state-sub">Try adjusting your filters or adding a new client</div></div>';
      if (window.lucide) lucide.createIcons();
      return;
    }

    el.innerHTML = `<div class="glass-card"><div class="data-table-wrap"><table class="data-table">
      <thead><tr>
        <th>Name</th><th>Location</th><th>Type</th><th>Service</th>
        <th>ICP</th><th>Lead Status</th><th>Urgency</th><th>Budget</th>
        <th class="col-admin-only">Phone</th><th class="col-admin-only">Email</th><th>Projects</th>
      </tr></thead>
      <tbody>${rows.map(c => `<tr style="cursor:pointer" onclick="showClient('${c.id}')">
        <td style="color:var(--text-primary);font-weight:500">${escapeHTML(c.name)}</td>
        <td>${c.location || '—'}</td>
        <td>${c.project_type || '—'}</td>
        <td>${c.service_interest || '—'}</td>
        <td>${c.icp_score || '—'}</td>
        <td><span class="status-badge ${stageClass(c.lead_status)}">${c.lead_status || '—'}</span></td>
        <td style="text-align:center">${urgencyIcon(c.urgency)}</td>
        <td class="mono" style="color:var(--gold)">${c.budget != null ? fmtCurrency(c.budget) : '—'}</td>
        <td class="mono col-admin-only">${c.phone || '—'}</td>
        <td class="col-admin-only">${c.email || '—'}</td>
        <td style="color:var(--gold);text-align:center">${(c.project_ids||[]).length || '—'}</td>
      </tr>`).join('')}</tbody>
    </table></div></div>`;
  }

  // ── Add Client Modal (via Side-Peek) ──
  window.showAddClientForm = function() {
    openSidePeek('New Client', `
      <details class="peek-section" open>
        <summary>Client Information</summary>
        <div class="peek-section-body">
          <label class="peek-label">Name *</label>
          <input id="new-client-name" class="peek-input" placeholder="Client name" />
          <label class="peek-label">Phone</label>
          <input id="new-client-phone" class="peek-input" placeholder="+971..." />
          <label class="peek-label">Email</label>
          <input id="new-client-email" class="peek-input" placeholder="email@domain.com" />
          <label class="peek-label">Location</label>
          <input id="new-client-location" class="peek-input" placeholder="Abu Dhabi / Dubai / Al Ain..." />
          <label class="peek-label">Project Type</label>
          <input id="new-client-type" class="peek-input" placeholder="Villa / Commercial / Residential..." />
          <label class="peek-label">Service Interest</label>
          <input id="new-client-service" class="peek-input" placeholder="Design / Supervision / Both" />
          <button class="btn btn-primary" onclick="submitNewClient()" style="width:100%;margin-top:12px">Create Client → Notion</button>
        </div>
      </details>
    `);
  };

  window.submitNewClient = async function() {
    const nameValid = validateRequired('new-client-name', 'Client name is required');
    const phoneValid = validatePattern('new-client-phone', /^[\+\d\s\-()]*$/, 'Invalid phone format');
    if (!nameValid || !phoneValid) return;

    const name = document.getElementById('new-client-name').value.trim();
    const data = {
      name,
      phone: document.getElementById('new-client-phone')?.value?.trim() || undefined,
      email: document.getElementById('new-client-email')?.value?.trim() || undefined,
      location: document.getElementById('new-client-location')?.value?.trim() || undefined,
      project_type: document.getElementById('new-client-type')?.value?.trim() || undefined,
      service_interest: document.getElementById('new-client-service')?.value?.trim() || undefined,
    };
    showToast('Creating client...', 'info');
    const res = await API.createClient(data);
    if (res && res.id) {
      showToast('Client created in Notion!', 'success');
      loaded = false;
      loadClients();
      closeSidePeek();
    } else {
      showToast('Failed to create client', 'error');
    }
  };

  // ── Show Client Detail (Side-Peek) ──
  window.showClient = async function(id) {
    const c = await API.client(id);
    if (!c) return;

    openSidePeek(`<span style="color:var(--gold)">${escapeHTML(c.name)}</span>`, `
      <!-- ── Contact ── -->
      <details class="peek-section" open>
        <summary>Contact</summary>
        <div class="peek-section-body">
          <div class="peek-row"><span class="peek-label">Phone</span><span class="mono">${c.phone || '—'}</span></div>
          ${c.phone_1 ? `<div class="peek-row"><span class="peek-label">Phone 2</span><span class="mono">${c.phone_1}</span></div>` : ''}
          <div class="peek-row"><span class="peek-label">Email</span><span>${c.email || '—'}</span></div>
          <div class="peek-row"><span class="peek-label">Channel</span><span>${c.preferred_channel || '—'}</span></div>
          <div class="peek-row"><span class="peek-label">Language</span><span>${c.preferred_language || '—'}</span></div>
        </div>
      </details>

      <!-- ── Profile ── -->
      <details class="peek-section" open>
        <summary>Profile</summary>
        <div class="peek-section-body">
          <div class="peek-row"><span class="peek-label">Location</span><span>${c.location || '—'}</span></div>
          <div class="peek-row"><span class="peek-label">Project Type</span><span>${c.project_type || '—'}</span></div>
          <div class="peek-row"><span class="peek-label">Service</span><span>${c.service_interest || '—'}</span></div>
          <div class="peek-row"><span class="peek-label">ICP Score</span><span style="color:var(--gold);font-weight:600">${c.icp_score || '—'}</span></div>
          <div class="peek-row"><span class="peek-label">Lead Source</span><span>${c.lead_source || '—'}</span></div>
          <div class="peek-row"><span class="peek-label">Project SNs</span><span class="mono">${c.project_s_num || '—'}</span></div>
          ${(c.nation||[]).length ? `<div class="peek-row"><span class="peek-label">Nation</span><span>${c.nation.join(', ')}</span></div>` : ''}
        </div>
      </details>

      <!-- ── Business ── -->
      <details class="peek-section" open>
        <summary>Business</summary>
        <div class="peek-section-body">
          <div class="peek-row"><span class="peek-label">Budget</span><span class="mono" style="color:var(--gold)">${c.budget != null ? fmtCurrency(c.budget) : '—'}</span></div>
          <div class="peek-row"><span class="peek-label">CLV</span><span class="mono" style="color:var(--gold)">${c.clv != null ? fmtCurrency(c.clv) : '—'}</span></div>
          <div class="peek-row"><span class="peek-label">Active Projects</span><span style="font-weight:600">${c.active_projects ?? '—'}</span></div>
        </div>
      </details>

      <!-- ── Lead Status ── -->
      <details class="peek-section" open>
        <summary>Status</summary>
        <div class="peek-section-body">
          <div class="peek-row"><span class="peek-label">Lead Status</span><span class="status-badge ${stageClass(c.lead_status)}">${c.lead_status || '—'}</span></div>
          <div class="peek-row"><span class="peek-label">Urgency</span><span>${urgencyIcon(c.urgency) || '—'} ${c.overdue_alert ? `<span style="color:var(--danger);margin-left:4px">${c.overdue_alert}</span>` : ''}</span></div>
          ${c.due_date ? `<div class="peek-row"><span class="peek-label">Due Date</span><span class="mono">${c.due_date}</span></div>` : ''}
          <div class="peek-row"><span class="peek-label">Days Since Contact</span><span class="mono" style="color:${c.days_since_contact > 30 ? 'var(--danger)' : 'var(--text-muted)'}">${c.days_since_contact ?? '—'} days</span></div>
          ${c.last_contacted ? `<div class="peek-row"><span class="peek-label">Last Contacted</span><span class="mono">${c.last_contacted}</span></div>` : ''}
        </div>
      </details>

      <!-- ── Quick Edit (Admin) / Read-Only (Team) ── -->
      ${API.isAdmin() ? `
      <details class="peek-section" open>
        <summary>Quick Edit</summary>
        <div class="peek-section-body">
          <label class="peek-label">Lead Status</label>
          <select id="edit-lead-status" class="peek-input">
            <option value="" ${!c.lead_status?'selected':''}>— Select —</option>
            ${['Inquiry','Qualified','Proposal','Negotiation','Won','Lost'].map(s => `<option value="${s}" ${c.lead_status===s?'selected':''}>${s}</option>`).join('')}
          </select>
          <label class="peek-label">Next Action</label>
          <input id="edit-next-action" class="peek-input" value="${c.next_action || ''}" placeholder="Enter next action..." />
          <label class="peek-label">Budget (AED)</label>
          <input id="edit-budget" type="number" class="peek-input" value="${c.budget || ''}" placeholder="Enter budget..." />
          <button class="btn btn-primary btn-sm" onclick="saveClientEdit('${c.id}')" style="width:100%;margin-top:8px">Save to Notion</button>
        </div>
      </details>` : `
      <details class="peek-section" open>
        <summary>Details</summary>
        <div class="peek-section-body">
          <div class="peek-row"><span class="peek-label">Next Action</span><span>${c.next_action || '—'}</span></div>
        </div>
      </details>`}

      <!-- ── Info ── -->
      <details class="peek-section">
        <summary>Assignment & Referrals</summary>
        <div class="peek-section-body">
          ${c.representative ? `<div class="peek-row"><span class="peek-label">Representative</span><span>${c.representative}</span></div>` : ''}
          ${c.referred_by ? `<div class="peek-row"><span class="peek-label">Referred By</span><span>${c.referred_by}</span></div>` : ''}
          ${(c.assigned_to||[]).length ? `<div class="peek-row"><span class="peek-label">Assigned To</span><span>${c.assigned_to.join(', ')}</span></div>` : ''}
          ${c.lost_reason ? `<div class="peek-row" style="color:var(--danger)"><span class="peek-label">Lost Reason</span><span>${c.lost_reason}</span></div>` : ''}
        </div>
      </details>

      <!-- ── Linked Projects ── -->
      <details class="peek-section" ${(c.project_ids||[]).length ? 'open' : ''}>
        <summary>Projects (${(c.project_ids||[]).length})</summary>
        <div class="peek-section-body">
          ${(c.project_ids||[]).length ? c.project_ids.map(pid =>
            `<div class="peek-row" style="color:var(--gold);cursor:pointer" onclick="showProject('${pid}')">View project →</div>`
          ).join('') : '<div style="color:var(--text-muted)">No linked projects</div>'}
        </div>
      </details>

      <!-- ── Add Interaction ── -->
      <details class="peek-section">
        <summary>Log Interaction</summary>
        <div class="peek-section-body">
          <input id="new-int-name" class="peek-input" placeholder="Interaction title..." />
          <select id="new-int-type" class="peek-input">
            <option value="">Select type...</option>
            <option value="Meeting">Meeting</option>
            <option value="Call">Call</option>
            <option value="Email">Email</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Site Visit">Site Visit</option>
          </select>
          <textarea id="new-int-summary" class="peek-input" style="min-height:60px;resize:vertical" placeholder="Summary..."></textarea>
          <input id="new-int-next" class="peek-input" placeholder="Next steps..." />
          <button class="btn btn-primary btn-sm" onclick="submitInteraction('${c.id}')" style="width:100%;margin-top:8px">Log Interaction</button>
        </div>
      </details>

      <!-- ── Interactions List ── -->
      ${(c.interactions||[]).length ? `
      <details class="peek-section" open>
        <summary>Interactions (${c.interactions.length})</summary>
        <div class="peek-section-body">
          ${c.interactions.map(i => `<div style="padding:8px 0;border-bottom:1px solid var(--glass-border)">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:500;color:var(--text-primary)">${escapeHTML(i.name)}</span>
              <span class="status-badge" style="font-size:0.6rem">${i.type||''}</span>
            </div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">${i.date||'—'} ${(i.logged_by||[]).length ? `· ${i.logged_by.join(', ')}` : ''}</div>
            ${i.summary ? `<div style="font-size:0.8rem;color:var(--text-secondary);margin-top:4px">${i.summary}</div>` : ''}
            ${i.next_steps ? `<div style="font-size:0.8rem;color:var(--gold);margin-top:4px">→ ${i.next_steps}</div>` : ''}
          </div>`).join('')}
        </div>
      </details>` : ''}

      <!-- ── Meta ── -->
      <details class="peek-section">
        <summary>Meta</summary>
        <div class="peek-section-body">
          <div class="peek-row"><span class="peek-label">Created</span><span class="mono" style="font-size:0.75rem">${c.created || '—'}</span></div>
        </div>
      </details>

      <!-- ── Archive (Admin) ── -->
      <div class="peek-section-body" data-role="admin" style="display:none">
        <button class="btn btn-danger btn-sm" style="width:100%" onclick="archiveRecord('client','${c.id}','${c.name.replace(/'/g,"&#39;")}')">Archive Client</button>
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
