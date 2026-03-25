/**
 * Majaz CRM — Meetings Page v4.0.0
 * Side-peek detail view for meeting records.
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
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">—</div><div class="empty-state-text">No meetings found</div></div>';
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
    openSidePeek(`<span style="color:var(--gold)">${m.name || 'Meeting'}</span>`, `
      <details class="peek-section" open>
        <summary>Meeting Details</summary>
        <div class="peek-section-body">
          <div class="peek-row"><span class="peek-label">Name</span><span style="font-weight:500">${m.name || '—'}</span></div>
          <div class="peek-row"><span class="peek-label">Created</span><span class="mono">${m.created || '—'}</span></div>
        </div>
      </details>
      <details class="peek-section" ${(m.attendee||[]).length ? 'open' : ''}>
        <summary>Attendees (${(m.attendee||[]).length})</summary>
        <div class="peek-section-body">
          ${(m.attendee||[]).length
            ? m.attendee.map(a => `<div class="peek-row"><span class="status-badge status-dd">${a}</span></div>`).join('')
            : '<div style="color:var(--text-muted)">No attendees listed</div>'}
        </div>
      </details>
      <details class="peek-section" ${(m.project_ids||[]).length ? 'open' : ''}>
        <summary>Linked Projects (${(m.project_ids||[]).length})</summary>
        <div class="peek-section-body">
          ${(m.project_ids||[]).length
            ? m.project_ids.map(pid => `<div class="peek-row" style="color:var(--gold);cursor:pointer" onclick="showProject('${pid}')">View project →</div>`).join('')
            : '<div style="color:var(--text-muted)">No linked projects</div>'}
        </div>
      </details>
    `);
  };
})();
