/**
 * Majaz CRM — Team & Suppliers Page v4.0.0
 * Side-peek detail view for team members and suppliers.
 */
(() => {
  let loaded = false;
  let currentTab = 'team-members';

  window.addEventListener('viewChange', (e) => {
    if (e.detail.view === 'team' && !loaded) loadTeam();
  });

  window.addEventListener('tabChange', (e) => {
    if (e.detail.tab === 'team-members' || e.detail.tab === 'suppliers') {
      currentTab = e.detail.tab;
      renderCurrentTab();
    }
  });

  let teamData = [], supplierData = [];

  async function loadTeam() {
    loaded = true;
    const [teamRes, supplierRes] = await Promise.all([API.team(), API.suppliers()]);
    teamData = teamRes?.rows || [];
    supplierData = supplierRes?.rows || [];
    renderCurrentTab();
  }

  function renderCurrentTab() {
    const el = document.getElementById('team-content');
    if (currentTab === 'team-members') renderTeamMembers(el);
    else renderSuppliers(el);
  }

  function renderTeamMembers(el) {
    if (!teamData.length) {
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👷</div><div class="empty-state-text">No team members found</div></div>';
      return;
    }
    el.innerHTML = `<div class="glass-card"><div class="data-table-wrap"><table class="data-table">
      <thead><tr>
        <th>Name</th><th>ID</th><th>Email</th><th>Work Phone</th><th>Personal</th><th>DOB</th><th>Joining Date</th><th>E-Pass</th>
      </tr></thead>
      <tbody>${teamData.map(m => `<tr style="cursor:pointer" onclick="showTeamMember('${m.id}')">
        <td style="color:var(--text-primary);font-weight:500">${m.name}</td>
        <td class="mono" style="color:var(--gold)">${m.uid||'—'}</td>
        <td>${m.email||'—'}</td>
        <td class="mono">${m.work_phone||'—'}</td>
        <td class="mono">${m.personal_phone||'—'}</td>
        <td class="mono">${m.dob||'—'}</td>
        <td class="mono">${m.joining_date||'—'}</td>
        <td class="mono">${m.e_pass||'—'}</td>
      </tr>`).join('')}</tbody>
    </table></div></div>`;
  }

  window.showTeamMember = function(id) {
    const m = teamData.find(t => t.id === id);
    if (!m) return;
    openSidePeek(`<span style="color:var(--gold)">${m.name}</span>`, `
      <details class="peek-section" open>
        <summary>👤 Team Member</summary>
        <div class="peek-section-body">
          <div class="peek-row"><span class="peek-label">ID</span><span class="mono" style="color:var(--gold)">${m.uid||'—'}</span></div>
          <div class="peek-row"><span class="peek-label">Email</span><span>📧 ${m.email||'—'}</span></div>
          <div class="peek-row"><span class="peek-label">Work Phone</span><span class="mono">📞 ${m.work_phone||'—'}</span></div>
          <div class="peek-row"><span class="peek-label">Personal</span><span class="mono">📱 ${m.personal_phone||'—'}</span></div>
          <div class="peek-row"><span class="peek-label">DOB</span><span>🎂 ${m.dob||'—'}</span></div>
          <div class="peek-row"><span class="peek-label">Joining Date</span><span>📅 ${m.joining_date||'—'}</span></div>
          ${m.e_pass ? `<div class="peek-row"><span class="peek-label">E-Pass</span><span class="mono">🪪 ${m.e_pass}</span></div>` : ''}
        </div>
      </details>
    `);
  };

  function renderSuppliers(el) {
    if (!supplierData.length) {
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🏭</div><div class="empty-state-text">No suppliers found</div></div>';
      return;
    }
    el.innerHTML = `<div class="glass-card"><div class="data-table-wrap"><table class="data-table">
      <thead><tr>
        <th>Name</th><th>Type</th><th>Speciality</th><th>Phone</th><th>Email</th><th>URL</th><th>Contact Person</th><th>ID</th>
      </tr></thead>
      <tbody>${supplierData.map(s => `<tr style="cursor:pointer" onclick="showSupplier('${s.id}')">
        <td style="color:var(--text-primary);font-weight:500">${s.name}</td>
        <td><span class="status-badge ${s.type==='Supplier'?'status-dd':'status-as'}">${s.type||'—'}</span></td>
        <td>${(s.speciality||[]).join(', ')||'—'}</td>
        <td class="mono">${s.phone||'—'}</td>
        <td>${s.email||'—'}</td>
        <td>${s.url ? `<a href="${s.url}" target="_blank" style="color:var(--gold)">↗</a>` : '—'}</td>
        <td>${s.contact_person||'—'}</td>
        <td class="mono" style="color:var(--gold)">${s.uid||'—'}</td>
      </tr>`).join('')}</tbody>
    </table></div></div>`;
  }

  window.showSupplier = function(id) {
    const s = supplierData.find(x => x.id === id);
    if (!s) return;
    openSidePeek(`<span style="color:var(--gold)">${s.name}</span>`, `
      <details class="peek-section" open>
        <summary>🏭 Supplier/Contractor</summary>
        <div class="peek-section-body">
          <div class="peek-row"><span class="peek-label">ID</span><span class="mono" style="color:var(--gold)">${s.uid||'—'}</span></div>
          <div class="peek-row"><span class="peek-label">Type</span><span class="status-badge ${s.type==='Supplier'?'status-dd':'status-as'}">${s.type||'—'}</span></div>
          <div class="peek-row"><span class="peek-label">Speciality</span><span>${(s.speciality||[]).join(', ')||'—'}</span></div>
        </div>
      </details>
      <details class="peek-section" open>
        <summary>📞 Contact</summary>
        <div class="peek-section-body">
          <div class="peek-row"><span class="peek-label">Phone</span><span class="mono">${s.phone||'—'}</span></div>
          <div class="peek-row"><span class="peek-label">Email</span><span>${s.email||'—'}</span></div>
          ${s.url ? `<div class="peek-row"><span class="peek-label">Website</span><a href="${s.url}" target="_blank" style="color:var(--gold)">${s.url} ↗</a></div>` : ''}
          <div class="peek-row"><span class="peek-label">Contact Person</span><span>${s.contact_person||'—'}</span></div>
        </div>
      </details>
    `);
  };
})();
