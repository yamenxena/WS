/**
 * Majaz CRM — API Client
 * Connects to the Flask proxy at Vercel (or localhost for dev).
 * Handles JWT token from sessionStorage.
 */
const API = (() => {
  const BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:5051'
    : '';

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
    // If dev-bypass or no token, use no_auth param
    return (!token || token === 'dev-bypass') ? 'no_auth=1' : '';
  }

  async function _fetch(endpoint) {
    try {
      const ap = _authParam();
      const sep = endpoint.includes('?') ? '&' : '?';
      const url = `${BASE}${endpoint}${ap ? sep + ap : ''}`;
      const res = await fetch(url, { headers: _headers() });
      if (res.status === 401) {
        sessionStorage.removeItem('majaz_token');
        window.location.href = 'login.html';
        return null;
      }
      if (!res.ok) throw new Error(`API ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(`[API] ${endpoint}:`, err);
      return null;
    }
  }

  async function _post(endpoint, data) {
    try {
      const ap = _authParam();
      const sep = endpoint.includes('?') ? '&' : '?';
      const url = `${BASE}${endpoint}${ap ? sep + ap : ''}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: _headers(),
        body: JSON.stringify(data)
      });
      if (res.status === 401) {
        sessionStorage.removeItem('majaz_token');
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
      const ap = _authParam();
      const sep = endpoint.includes('?') ? '&' : '?';
      const url = `${BASE}${endpoint}${ap ? sep + ap : ''}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: _headers(),
        body: JSON.stringify(data)
      });
      if (res.status === 401) {
        sessionStorage.removeItem('majaz_token');
        window.location.href = 'login.html';
        return null;
      }
      return await res.json();
    } catch (err) {
      console.error(`[API PATCH] ${endpoint}:`, err);
      return null;
    }
  }

  return {
    dashboard:    () => _fetch('/api/dashboard'),
    clients:      () => _fetch('/api/clients'),
    client:       (id) => _fetch(`/api/clients/${id}`),
    projects:     () => _fetch('/api/projects'),
    project:      (id) => _fetch(`/api/projects/${id}`),
    tasks:        () => _fetch('/api/tasks'),
    team:         () => _fetch('/api/team'),
    suppliers:    () => _fetch('/api/suppliers'),
    meetings:     () => _fetch('/api/meetings'),
    pipeline:     () => _fetch('/api/pipeline'),
    interactions: () => _fetch('/api/interactions'),
    stageCards:   () => _fetch('/api/stage-cards'),

    updateProject: (id, data) => _patch(`/api/projects/${id}`, data),
    updateTask:    (id, data) => _patch(`/api/tasks/${id}`, data),
    updateClient:  (id, data) => _patch(`/api/clients/${id}`, data),

    createClient:      (data) => _post('/api/clients', data),
    createInteraction: (data) => _post('/api/interactions', data),

    logout: () => {
      sessionStorage.removeItem('majaz_token');
      window.location.href = 'login.html';
    }
  };
})();
