/**
 * Majaz CRM — Router & Shell Logic v4.0.0
 * Handles view switching, sidebar, mobile toggle, role-based nav,
 * side-peek panel, toast notifications, and utility functions.
 */
document.addEventListener('DOMContentLoaded', () => {
  // ══════════════════════════════════════════════════════════════
  // ELEMENTS
  // ══════════════════════════════════════════════════════════════
  const sidebar     = document.getElementById('sidebar');
  const hamburger   = document.getElementById('hamburger');
  const overlay     = document.getElementById('sidebar-overlay');
  const navItems    = document.querySelectorAll('.nav-item[data-view]');
  const views       = document.querySelectorAll('.view');
  const dateEl      = document.getElementById('current-date');
  // Side-peek panel
  const sidePeek      = document.getElementById('side-peek');
  const sidePeekClose = document.getElementById('side-peek-close');

  // ══════════════════════════════════════════════════════════════
  // ROLE-BASED INITIALIZATION
  // ══════════════════════════════════════════════════════════════
  const role = sessionStorage.getItem('majaz_role') || 'team';

  // Apply role class to body — this drives CSS visibility rules
  if (role === 'admin') {
    document.body.classList.add('role-admin');
  } else {
    document.body.classList.remove('role-admin');
    // Hide all admin-only elements (buttons, nav items) for team users
    document.querySelectorAll('[data-role="admin"]').forEach(el => {
      el.style.display = 'none';
    });
  }

  // Team users cannot navigate to admin-only views
  const adminOnlyViews = new Set([
    'meetings', 'pipeline', 'interactions', 'concept-plans', 'reports', 'admin-settings'
  ]);

  // ══════════════════════════════════════════════════════════════
  // DATE DISPLAY
  // ══════════════════════════════════════════════════════════════
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  // ══════════════════════════════════════════════════════════════
  // MOBILE SIDEBAR TOGGLE
  // ══════════════════════════════════════════════════════════════
  hamburger?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  });

  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });

  // ══════════════════════════════════════════════════════════════
  // SIDEBAR COLLAPSE TOGGLE (P1)
  // ══════════════════════════════════════════════════════════════
  const collapseBtn = document.getElementById('sidebar-collapse-btn');
  const COLLAPSE_KEY = 'majaz-sidebar';

  function setSidebarCollapsed(collapsed) {
    sidebar.classList.toggle('sidebar-collapsed', collapsed);
    document.body.classList.toggle('sidebar-is-collapsed', collapsed);
    localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
  }

  // Restore persisted state
  const savedCollapse = localStorage.getItem(COLLAPSE_KEY);
  if (savedCollapse === '1' || (savedCollapse === null && window.innerWidth < 1024)) {
    setSidebarCollapsed(true);
  }

  collapseBtn?.addEventListener('click', () => {
    const isCollapsed = sidebar.classList.contains('sidebar-collapsed');
    setSidebarCollapsed(!isCollapsed);
  });

  // Auto-collapse on narrow viewports
  window.addEventListener('resize', () => {
    if (window.innerWidth < 1024 && !sidebar.classList.contains('sidebar-collapsed')) {
      setSidebarCollapsed(true);
    }
  });

  // ══════════════════════════════════════════════════════════════
  // VIEW SWITCHING
  // ══════════════════════════════════════════════════════════════
  function switchView(viewName) {
    // Guard: team users cannot access admin-only views
    if (role !== 'admin' && adminOnlyViews.has(viewName)) {
      viewName = 'dashboard';
    }

    // P8.6 — View Transitions API (progressive enhancement)
    const doSwitch = () => {
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

      // Close panels
      closeSidePeek();

      // Scroll main to top
      document.getElementById('main-content')?.scrollTo(0, 0);

      // Trigger page load
      const event = new CustomEvent('viewChange', { detail: { view: viewName, role } });
      window.dispatchEvent(event);

      // P8.2 — Apply row stagger after render
      requestAnimationFrame(() => applyRowStagger());
    };

    if (document.startViewTransition) {
      document.startViewTransition(doSwitch);
    } else {
      doSwitch();
    }
  }

  // P8.2 — Set --row-i CSS variable on table rows for stagger animation
  function applyRowStagger() {
    document.querySelectorAll('.data-table tbody tr').forEach((row, i) => {
      row.style.setProperty('--row-i', Math.min(i, 15)); // cap at 15 for perf (600ms max)
    });
  }

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      switchView(item.dataset.view);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // SIDE-PEEK PANEL (New standard — replaces detail panel in R3)
  // ══════════════════════════════════════════════════════════════
  window.openSidePeek = function(title, html) {
    document.getElementById('side-peek-title').innerHTML = title;
    document.getElementById('side-peek-body').innerHTML = html;
    sidePeek.classList.add('open');
    document.body.classList.add('peek-open');
  };

  function closeSidePeek() {
    sidePeek?.classList.remove('open');
    document.body.classList.remove('peek-open');
  }

  window.closeSidePeek = closeSidePeek;
  sidePeekClose?.addEventListener('click', closeSidePeek);



  // ══════════════════════════════════════════════════════════════
  // TAB BARS
  // ══════════════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════════════
  // UTILITY: Stage CSS class (complete palette — all databases)
  // ══════════════════════════════════════════════════════════════
  window.stageClass = function(stage) {
    if (!stage) return '';
    const s = stage.toLowerCase();
    // Project stages
    if (s.includes('sd') || s.includes('schematic'))    return 'status-sd';
    if (s.includes('dd') || s.includes('design dev'))   return 'status-dd';
    if (s.includes('cd') || s.includes('construction')) return 'status-cd';
    if (s.includes('as') || s.includes('authorit'))     return 'status-as';
    if (s === 'done')                                   return 'status-done';
    if (s === 'completed')                              return 'status-completed';
    if (s.includes('handing'))                          return 'status-handover';
    if (s.includes('progress') || s.includes('supervision')) return 'status-supervision';
    if (s === 'on hold')                                return 'status-hold';
    if (s === 'kickoff')                                return 'status-kickoff';
    if (s === 'bidding')                                return 'status-bidding';
    if (s === 'not started')                            return 'status-notstart';
    // Task statuses
    if (s.includes('sent to structure'))                return 'status-sent-structure';
    if (s.includes('needs review'))                     return 'status-needs-review';
    if (s.includes('sent to client'))                   return 'status-sent-client';
    if (s.includes('submitted'))                        return 'status-submitted';
    if (s === 'in progress')                            return 'status-in-progress';
    // Lead statuses
    if (s === 'inquiry')                                return 'status-inquiry';
    if (s === 'qualified')                              return 'status-qualified';
    if (s === 'proposal')                               return 'status-proposal';
    if (s === 'negotiation')                            return 'status-negotiation';
    if (s === 'won')                                    return 'status-won';
    if (s === 'lost')                                   return 'status-lost';
    return '';
  };

  // ══════════════════════════════════════════════════════════════
  // UTILITY: Short stage name
  // ══════════════════════════════════════════════════════════════
  window.shortStage = function(stage) {
    if (!stage) return '—';
    if (stage.includes('SD'))          return 'SD';
    if (stage.includes('DD'))          return 'DD';
    if (stage.includes('CD'))          return 'CD';
    if (stage.includes('AS'))          return 'AS';
    if (stage.includes('Progress'))    return 'SUPV';
    if (stage.includes('Done'))        return 'DONE';
    if (stage.includes('Completed'))   return 'DONE';
    if (stage.includes('Handing'))     return 'H/O';
    if (stage.includes('Kickoff'))     return 'KICK';
    if (stage.includes('Bidding'))     return 'BID';
    if (stage.includes('On Hold'))     return 'HOLD';
    if (stage.includes('Not started')) return 'NEW';
    return stage;
  };

  // ══════════════════════════════════════════════════════════════
  // UTILITY: Get current user role
  // ══════════════════════════════════════════════════════════════
  window.getRole = function() {
    return sessionStorage.getItem('majaz_role') || 'team';
  };

  window.isAdmin = function() {
    return window.getRole() === 'admin';
  };

  // ══════════════════════════════════════════════════════════════
  // LOGOUT
  // ══════════════════════════════════════════════════════════════
  document.getElementById('nav-logout')?.addEventListener('click', () => {
    if (typeof API !== 'undefined' && API.logout) API.logout();
    else {
      sessionStorage.removeItem('majaz_token');
      sessionStorage.removeItem('majaz_role');
      window.location.href = 'login.html';
    }
  });

  // ══════════════════════════════════════════════════════════════
  // TOAST NOTIFICATION SYSTEM
  // ══════════════════════════════════════════════════════════════
  const toastContainer = document.getElementById('toast-container')
    || (() => { const c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); return c; })();

  window.showToast = function(message, type = 'info', durationMs = 3500) {
    const icons = { success: '✓', error: '✗', info: 'i', warning: '!' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'i'}</span><span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 300);
    }, durationMs);
  };

  // ══════════════════════════════════════════════════════════════
  // BOOT
  // ══════════════════════════════════════════════════════════════
  switchView('dashboard');
});
