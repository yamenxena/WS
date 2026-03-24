/**
 * Majaz CRM — Team & Suppliers Page
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
        <th>Name</th><th>ID</th><th>Email</th><th>Work Phone</th><th>Joining Date</th>
      </tr></thead>
      <tbody>${teamData.map(m => `<tr>
        <td style="color:var(--text-primary);font-weight:500">${m.name}</td>
        <td class="mono" style="color:var(--gold)">${m.uid||'—'}</td>
        <td>${m.email||'—'}</td>
        <td class="mono">${m.work_phone||'—'}</td>
        <td>${m.joining_date||'—'}</td>
      </tr>`).join('')}</tbody>
    </table></div></div>`;
  }

  function renderSuppliers(el) {
    if (!supplierData.length) {
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🏭</div><div class="empty-state-text">No suppliers found</div></div>';
      return;
    }
    el.innerHTML = `<div class="glass-card"><div class="data-table-wrap"><table class="data-table">
      <thead><tr>
        <th>Name</th><th>Type</th><th>Speciality</th><th>Phone</th><th>Email</th><th>Contact</th>
      </tr></thead>
      <tbody>${supplierData.map(s => `<tr>
        <td style="color:var(--text-primary);font-weight:500">${s.name}</td>
        <td><span class="status-badge ${s.type==='Supplier'?'status-dd':'status-as'}">${s.type||'—'}</span></td>
        <td>${(s.speciality||[]).join(', ')||'—'}</td>
        <td class="mono">${s.phone||'—'}</td>
        <td>${s.email||'—'}</td>
        <td>${s.contact_person||'—'}</td>
      </tr>`).join('')}</tbody>
    </table></div></div>`;
  }
})();
