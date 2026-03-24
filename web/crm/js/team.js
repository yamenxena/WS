/**
 * Majaz CRM — Team & Suppliers Page (Full-Property Rendering)
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
    openDetail(m.name, `
      <div class="detail-section"><div class="detail-label">👤 Team Member</div>
        <div class="detail-value">ID: <span class="mono" style="color:var(--gold)">${m.uid||'—'}</span></div>
        <div class="detail-value">📧 Email: ${m.email||'—'}</div>
        <div class="detail-value">📞 Work: <span class="mono">${m.work_phone||'—'}</span></div>
        <div class="detail-value">📱 Personal: <span class="mono">${m.personal_phone||'—'}</span></div>
        <div class="detail-value">🎂 DOB: ${m.dob||'—'}</div>
        <div class="detail-value">📅 Joining: ${m.joining_date||'—'}</div>
        ${m.e_pass ? `<div class="detail-value">🪪 E-Pass: <span class="mono">${m.e_pass}</span></div>` : ''}
      </div>
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
    openDetail(s.name, `
      <div class="detail-section"><div class="detail-label">🏭 Supplier/Contractor</div>
        <div class="detail-value">ID: <span class="mono" style="color:var(--gold)">${s.uid||'—'}</span></div>
        <div class="detail-value">Type: <span class="status-badge ${s.type==='Supplier'?'status-dd':'status-as'}">${s.type||'—'}</span></div>
        <div class="detail-value">Speciality: ${(s.speciality||[]).join(', ')||'—'}</div>
      </div>
      <div class="detail-section"><div class="detail-label">📞 Contact</div>
        <div class="detail-value">Phone: <span class="mono">${s.phone||'—'}</span></div>
        <div class="detail-value">Email: ${s.email||'—'}</div>
        ${s.url ? `<div class="detail-value">Website: <a href="${s.url}" target="_blank" style="color:var(--gold)">${s.url} ↗</a></div>` : ''}
        <div class="detail-value">Contact Person: ${s.contact_person||'—'}</div>
      </div>
    `);
  };
})();
