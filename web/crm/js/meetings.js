/**
 * Majaz CRM — Meetings Page
 * Renders all meeting records from Notion with attendees and linked projects.
 */
(() => {
  let meetingsData = [];
  let loaded = false;

  window.addEventListener('viewChange', (e) => {
    if (e.detail.view === 'meetings' && !loaded) loadMeetings();
  });

  async function loadMeetings() {
    loaded = true;
    const res = await API.meetings();
    if (!res) return;
    meetingsData = res.rows || [];
    const badge = document.getElementById('badge-meetings');
    if (badge) badge.textContent = meetingsData.length;
    renderTable(meetingsData);

    document.getElementById('meetings-search')?.addEventListener('input', () => {
      const q = (document.getElementById('meetings-search')?.value || '').toLowerCase();
      const filtered = q ? meetingsData.filter(m =>
        m.name.toLowerCase().includes(q) || (m.attendee||[]).join(' ').toLowerCase().includes(q)
      ) : meetingsData;
      renderTable(filtered);
    });
  }

  function renderTable(rows) {
    const el = document.getElementById('meetings-content');
    if (!rows.length) {
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📅</div><div class="empty-state-text">No meetings found</div></div>';
      return;
    }

    el.innerHTML = `<div class="glass-card"><div class="data-table-wrap"><table class="data-table">
      <thead><tr>
        <th>Meeting</th><th>Attendees</th><th>Linked Projects</th><th>Created</th>
      </tr></thead>
      <tbody>${rows.map(m => `<tr style="cursor:pointer" onclick="showMeeting('${m.id}')">
        <td style="color:var(--text-primary);font-weight:500">${m.name || '—'}</td>
        <td>${(m.attendee||[]).map(a => `<span class="status-badge status-dd" style="margin:2px">${a}</span>`).join(' ') || '—'}</td>
        <td style="color:var(--gold)">${(m.project_ids||[]).length || '—'}</td>
        <td class="mono">${m.created || '—'}</td>
      </tr>`).join('')}</tbody>
    </table></div></div>`;
  }

  window.showMeeting = function(id) {
    const m = meetingsData.find(x => x.id === id);
    if (!m) return;
    openDetail(m.name || 'Meeting', `
      <div class="detail-section"><div class="detail-label">📅 Meeting Details</div>
        <div class="detail-value">Name: <strong style="color:var(--text-primary)">${m.name || '—'}</strong></div>
        <div class="detail-value">Created: <span class="mono">${m.created || '—'}</span></div>
      </div>
      <div class="detail-section"><div class="detail-label">👥 Attendees (${(m.attendee||[]).length})</div>
        ${(m.attendee||[]).length
          ? m.attendee.map(a => `<div class="detail-value"><span class="status-badge status-dd">${a}</span></div>`).join('')
          : '<div class="detail-value" style="color:var(--text-muted)">No attendees listed</div>'}
      </div>
      <div class="detail-section"><div class="detail-label">📐 Linked Projects (${(m.project_ids||[]).length})</div>
        ${(m.project_ids||[]).length
          ? m.project_ids.map(pid => `<div class="detail-value" style="color:var(--gold);cursor:pointer" onclick="showProject('${pid}')">🔗 View project →</div>`).join('')
          : '<div class="detail-value" style="color:var(--text-muted)">No linked projects</div>'}
      </div>
    `);
  };
})();
