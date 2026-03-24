/**
 * Majaz CRM — Router & Shell Logic
 * Handles view switching, sidebar, mobile toggle, date display
 */
document.addEventListener('DOMContentLoaded', () => {
  // ── Elements ──
  const sidebar    = document.getElementById('sidebar');
  const hamburger  = document.getElementById('hamburger');
  const overlay    = document.getElementById('sidebar-overlay');
  const navItems   = document.querySelectorAll('.nav-item[data-view]');
  const views      = document.querySelectorAll('.view');
  const dateEl     = document.getElementById('current-date');
  const detailPanel = document.getElementById('detail-panel');
  const detailClose = document.getElementById('detail-close');

  // ── Date ──
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  // ── Mobile Toggle ──
  hamburger?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  });

  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });

  // ── View Switching ──
  function switchView(viewName) {
    // Update nav
    navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Update views
    views.forEach(v => {
      v.classList.toggle('active', v.id === `view-${viewName}`);
    });

    // Close mobile sidebar
    sidebar.classList.remove('open');
    overlay.classList.remove('open');

    // Close detail panel
    closeDetail();

    // Scroll main to top
    document.getElementById('main-content')?.scrollTo(0, 0);

    // Trigger page load if first visit
    const event = new CustomEvent('viewChange', { detail: { view: viewName } });
    window.dispatchEvent(event);
  }

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      switchView(item.dataset.view);
    });
  });

  // ── Detail Panel ──
  window.openDetail = function(title, html) {
    document.getElementById('detail-title').textContent = title;
    document.getElementById('detail-body').innerHTML = html;
    detailPanel.classList.add('open');
  };

  function closeDetail() {
    detailPanel?.classList.remove('open');
  }

  detailClose?.addEventListener('click', closeDetail);

  // ── Tab Bars ──
  document.querySelectorAll('.tab-bar').forEach(bar => {
    bar.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        bar.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const event = new CustomEvent('tabChange', { detail: { tab: btn.dataset.tab } });
        window.dispatchEvent(event);
      });
    });
  });

  // ── Utility: Stage CSS class (covers all databases) ──
  window.stageClass = function(stage) {
    if (!stage) return '';
    const s = stage.toLowerCase();
    // Project stages
    if (s.includes('sd') || s.includes('schematic')) return 'status-sd';
    if (s.includes('dd') || s.includes('design dev')) return 'status-dd';
    if (s.includes('cd') || s.includes('construction')) return 'status-cd';
    if (s.includes('as') || s.includes('authorit')) return 'status-as';
    if (s.includes('done') || s.includes('complet')) return 'status-done';
    if (s.includes('progress') || s.includes('supervision')) return 'status-progress';
    if (s.includes('handing')) return 'status-done';
    if (s === 'on hold') return 'status-hold';
    if (s === 'kickoff') return 'status-dd';
    if (s === 'bidding') return 'status-cd';
    if (s === 'not started') return '';
    // Task statuses
    if (s.includes('sent to structure')) return 'status-cd';
    if (s.includes('needs review')) return 'status-cd';
    if (s.includes('sent to client')) return 'status-as';
    if (s.includes('submitted')) return 'status-as';
    if (s === 'in progress') return 'status-dd';
    // Client lead statuses
    if (s === 'inquiry') return '';
    if (s === 'qualified') return 'status-sd';
    if (s === 'proposal') return 'status-dd';
    if (s === 'negotiation') return 'status-cd';
    if (s === 'won') return 'status-done';
    if (s === 'lost') return 'status-lost';
    return '';
  };

  // ── Utility: Short stage name ──
  window.shortStage = function(stage) {
    if (!stage) return '—';
    if (stage.includes('SD')) return 'SD';
    if (stage.includes('DD')) return 'DD';
    if (stage.includes('CD')) return 'CD';
    if (stage.includes('AS')) return 'AS';
    if (stage.includes('Progress')) return 'SUPV';
    if (stage.includes('Done') || stage.includes('Completed')) return 'DONE';
    if (stage.includes('Handing')) return 'H/O';
    if (stage.includes('Kickoff')) return 'KICK';
    if (stage.includes('Bidding')) return 'BID';
    if (stage.includes('On Hold')) return 'HOLD';
    if (stage.includes('Not started')) return 'NEW';
    return stage;
  };

  // ── Logout ──
  document.getElementById('nav-logout')?.addEventListener('click', () => {
    if (typeof API !== 'undefined' && API.logout) API.logout();
    else {
      sessionStorage.removeItem('majaz_token');
      window.location.href = 'login.html';
    }
  });

  // ── Toast Notification System ──
  const toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  document.body.appendChild(toastContainer);

  window.showToast = function(message, type = 'info', durationMs = 3500) {
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 300);
    }, durationMs);
  };

  // ── Boot ──
  switchView('dashboard');
});
