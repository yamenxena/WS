/**
 * Majaz CRM — API Client v4.0.0
 * Connects to the Flask proxy at Vercel (or localhost for dev).
 * Handles JWT token + role from sessionStorage.
 */
const API = (() => {
  const BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:5051'
    : '';

  // ── Auth helpers ──
  function _headers() {
    const h = { 'Content-Type': 'application/json' };
    const token = sessionStorage.getItem('majaz_token');
    if (token && token !== 'dev-bypass') {
      h['Authorization'] = `Bearer ${token}`;
    }
    return h;
  }

  function _authParam() {
    const token = sessionStorage.getItem('majaz_token');
    return (!token || token === 'dev-bypass') ? 'no_auth=1' : '';
  }

  function _url(endpoint) {
    const ap = _authParam();
    const sep = endpoint.includes('?') ? '&' : '?';
    return `${BASE}${endpoint}${ap ? sep + ap : ''}`;
  }

  // ── HTTP methods ──
  async function _get(endpoint) {
    try {
      const res = await fetch(_url(endpoint), { headers: _headers() });
      if (res.status === 401) {
        sessionStorage.removeItem('majaz_token');
        sessionStorage.removeItem('majaz_role');
        window.location.href = 'login.html';
        return null;
      }
      if (!res.ok) throw new Error(`API ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(`[API GET] ${endpoint}:`, err);
      return null;
    }
  }

  async function _post(endpoint, data) {
    try {
      const res = await fetch(_url(endpoint), {
        method: 'POST',
        headers: _headers(),
        body: JSON.stringify(data)
      });
      if (res.status === 401) {
        sessionStorage.removeItem('majaz_token');
        sessionStorage.removeItem('majaz_role');
        window.location.href = 'login.html';
        return null;
      }
      return await res.json();
    } catch (err) {
      console.error(`[API POST] ${endpoint}:`, err);
      return null;
    }
  }

  async function _patch(endpoint, data) {
    try {
      const res = await fetch(_url(endpoint), {
        method: 'PATCH',
        headers: _headers(),
        body: JSON.stringify(data)
      });
      if (res.status === 401) {
        sessionStorage.removeItem('majaz_token');
        sessionStorage.removeItem('majaz_role');
        window.location.href = 'login.html';
        return null;
      }
      return await res.json();
    } catch (err) {
      console.error(`[API PATCH] ${endpoint}:`, err);
      return null;
    }
  }

  // ── Public API ──
  return {
    // Role
    getRole:  () => sessionStorage.getItem('majaz_role') || 'team',
    isAdmin:  () => (sessionStorage.getItem('majaz_role') || 'team') === 'admin',

    // Read
    dashboard:    () => _get('/api/dashboard'),
    clients:      () => _get('/api/clients'),
    client:       (id) => _get(`/api/clients/${id}`),
    projects:     () => _get('/api/projects'),
    project:      (id) => _get(`/api/projects/${id}`),
    tasks:        () => _get('/api/tasks'),
    team:         () => _get('/api/team'),
    suppliers:    () => _get('/api/suppliers'),
    meetings:     () => _get('/api/meetings'),
    pipeline:     () => _get('/api/pipeline'),
    interactions: () => _get('/api/interactions'),
    stageCards:   () => _get('/api/stage-cards'),
    conceptPlans: () => _get('/api/concept-plans'),

    // Write
    createClient:      (data) => _post('/api/clients', data),
    createProject:     (data) => _post('/api/projects', data),
    createTask:        (data) => _post('/api/tasks', data),
    createInteraction: (data) => _post('/api/interactions', data),

    // Update
    updateClient:  (id, data) => _patch(`/api/clients/${id}`, data),
    updateProject: (id, data) => _patch(`/api/projects/${id}`, data),
    updateTask:    (id, data) => _patch(`/api/tasks/${id}`, data),

    // Session
    logout: () => {
      sessionStorage.removeItem('majaz_token');
      sessionStorage.removeItem('majaz_role');
      window.location.href = 'login.html';
    }
  };
})();
