/**
 * Majaz CRM — API Client
 * Connects to the Flask proxy at Vercel (or localhost for dev).
 */
const API = (() => {
  // Auto-detect: if running on Vercel, use relative URL; otherwise localhost
  const BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:5051'
    : '';

  const AUTH_PARAM = '?no_auth=1'; // Dev mode bypass

  async function _fetch(endpoint) {
    try {
      const sep = endpoint.includes('?') ? '&' : '?';
      const url = `${BASE}${endpoint}${sep}no_auth=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(`[API] ${endpoint}:`, err);
      return null;
    }
  }

  async function _post(endpoint, data) {
    try {
      const res = await fetch(`${BASE}${endpoint}?no_auth=1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (err) {
      console.error(`[API POST] ${endpoint}:`, err);
      return null;
    }
  }

  async function _patch(endpoint, data) {
    try {
      const res = await fetch(`${BASE}${endpoint}?no_auth=1`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
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
  };
})();
