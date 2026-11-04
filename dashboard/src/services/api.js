
const API_BASE = '/api';
const TOKEN_KEY = 'epa_auth_token';

export function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    console.warn('localStorage error:', e);
  }
}

export function clearAuthToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.warn('localStorage error:', e);
  }
}

export async function authFetch(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getAuthToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  return response;
}

export async function loginUser({ username, password, turnstileToken }) {
  const resp = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, turnstileToken })
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data.error || `Login failed (HTTP ${resp.status})`);
  }
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}



export async function logoutUser() {
  try {
    await authFetch(`${API_BASE}/auth/logout`, { method: 'POST' });
  } catch (e) {
    console.warn('Logout API warning:', e);
  } finally {
    clearAuthToken();
  }
  return { success: true };
}

export async function getMe() {
  const resp = await authFetch(`${API_BASE}/auth/me`);
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }
  return await resp.json();
}

export async function getTurnstileSiteKey() {
  try {
    const resp = await fetch(`${API_BASE}/auth/turnstile-key`);
    const data = await resp.json();
    return data?.siteKey || '';
  } catch {
    return '';
  }
}

export async function verifyTurnstileToken(token) {
  const resp = await fetch(`${API_BASE}/turnstile/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  return await resp.json();
}

export async function getUsers(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.roleId && params.roleId !== 'all') query.set('roleId', params.roleId);
  if (params.isActive !== undefined && params.isActive !== 'all') query.set('isActive', String(params.isActive));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.offset) query.set('offset', String(params.offset));

  const url = `${API_BASE}/users${query.toString() ? `?${query.toString()}` : ''}`;
  const resp = await authFetch(url);
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }
  return await resp.json();
}

export async function getUser(userId) {
  const resp = await authFetch(`${API_BASE}/users/${userId}`);
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }
  return await resp.json();
}

export async function createUser(userData) {
  const resp = await authFetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data.error || `Failed to create user (HTTP ${resp.status})`);
  }
  return data;
}

export async function updateUser(userId, userData) {
  const resp = await authFetch(`${API_BASE}/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data.error || `Failed to update user (HTTP ${resp.status})`);
  }
  return data;
}

export async function deleteUser(userId) {
  const resp = await authFetch(`${API_BASE}/users/${userId}`, {
    method: 'DELETE'
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data.error || `Failed to delete user (HTTP ${resp.status})`);
  }
  return data;
}

export async function getRoles() {
  const resp = await authFetch(`${API_BASE}/roles`);
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }
  return await resp.json();
}

export async function getRole(roleId) {
  const resp = await authFetch(`${API_BASE}/roles/${roleId}`);
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }
  return await resp.json();
}

export async function createRole(roleData) {
  const resp = await authFetch(`${API_BASE}/roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(roleData)
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data.error || `Failed to create role (HTTP ${resp.status})`);
  }
  return data;
}

export async function updateRole(roleId, roleData) {
  const resp = await authFetch(`${API_BASE}/roles/${roleId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(roleData)
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data.error || `Failed to update role (HTTP ${resp.status})`);
  }
  return data;
}

export async function deleteRole(roleId) {
  const resp = await authFetch(`${API_BASE}/roles/${roleId}`, {
    method: 'DELETE'
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data.error || `Failed to delete role (HTTP ${resp.status})`);
  }
  return data;
}

export async function getPermissions() {
  const resp = await authFetch(`${API_BASE}/permissions`);
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }
  return await resp.json();
}

export async function getSettings() {
  const resp = await authFetch(`${API_BASE}/settings`);
  if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
  return await resp.json();
}

export async function updateSettings(settings) {
  const resp = await authFetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  if (!resp.ok) throw new Error(`Failed to update settings: HTTP ${resp.status}`);
  return await resp.json();
}

export async function testXConnection(credentials) {
  const resp = await authFetch(`${API_BASE}/x/test-connection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
  return await resp.json();
}

export async function getPosts(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.city && params.city !== 'all') query.set('city', params.city);
  if (params.severity && params.severity !== 'all') query.set('severity', params.severity);
  if (params.category && params.category !== 'all') query.set('category', params.category);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder || params.order) query.set('order', params.sortOrder || params.order);
  if (params.limit) query.set('limit', String(params.limit));
  if (params.offset) query.set('offset', String(params.offset));

  const url = `${API_BASE}/posts${query.toString() ? `?${query.toString()}` : ''}`;
  const resp = await authFetch(url);
  if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
  return await resp.json();
}

export async function searchXApi({ keyword, liveOverride = false, maxResults = 25, simulateIfMissing = true }) {
  const resp = await authFetch(`${API_BASE}/x/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      keyword,
      liveOverride,
      maxResults,
      simulateIfMissing
    })
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `HTTP error ${resp.status}`);
  }
  return await resp.json();
}

export async function ingestPostsBatch(posts, mode = 'merge') {
  const resp = await authFetch(`${API_BASE}/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ posts, mode })
  });
  if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
  return await resp.json();
}

export async function getStats() {
  const resp = await authFetch(`${API_BASE}/stats`);
  if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
  return await resp.json();
}

export async function getAuditLogs(limit = 1000) {
  const resp = await authFetch(`${API_BASE}/audit?limit=${limit}`);
  if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
  return await resp.json();
}

export async function getNoisePosts(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.category && params.category !== 'all') query.set('category', params.category);
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params.limit) query.set('limit', String(params.limit));
  if (params.offset) query.set('offset', String(params.offset));

  const url = `${API_BASE}/noise${query.toString() ? `?${query.toString()}` : ''}`;
  const resp = await authFetch(url);
  if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
  return await resp.json();
}

export async function getNoiseStats() {
  const resp = await authFetch(`${API_BASE}/noise/stats`);
  if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
  return await resp.json();
}

export async function restoreNoisePost(postId, learnedRules = []) {
  const resp = await authFetch(`${API_BASE}/noise/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId, learnedRules })
  });
  if (!resp.ok) throw new Error(`Failed to restore post: HTTP ${resp.status}`);
  return await resp.json();
}

export async function excludePost({ postId, reason = '', category = 'MANUAL_EXCLUDED', removeAssociatedRules = true }) {
  const resp = await authFetch(`${API_BASE}/noise/exclude`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId, reason, category, removeAssociatedRules })
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Failed to exclude post: HTTP ${resp.status}`);
  }
  return await resp.json();
}

export async function extractNoiseCandidates({ postId, text = '', author = '', category = '', reason = '' }) {
  const resp = await authFetch(`${API_BASE}/noise/candidates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId, text, author, category, reason })
  });
  if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
  return await resp.json();
}

export async function getLearnedRules() {
  const resp = await authFetch(`${API_BASE}/learned-rules`);
  if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
  return await resp.json();
}

export async function addLearnedRule(rule) {
  const resp = await authFetch(`${API_BASE}/learned-rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rule)
  });
  if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
  return await resp.json();
}

export async function toggleLearnedRule(id, isActive) {
  const resp = await authFetch(`${API_BASE}/learned-rules/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, isActive })
  });
  if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
  return await resp.json();
}

export async function deleteLearnedRule(id) {
  const resp = await authFetch(`${API_BASE}/learned-rules/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
  return await resp.json();
}

export async function getSentimentStatus() {
  const resp = await authFetch(`${API_BASE}/sentiment/status`);
  if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
  return await resp.json();
}

export async function setSentimentEngine(engine) {
  const resp = await authFetch(`${API_BASE}/sentiment/engine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ engine })
  });
  if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
  return await resp.json();
}

export async function reanalyzeSentiment(engine) {
  const resp = await authFetch(`${API_BASE}/sentiment/reanalyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ engine })
  });
  if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
  return await resp.json();
}

export async function getQueryVersions() {
  const resp = await authFetch(`${API_BASE}/queries`);
  if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
  return await resp.json();
}

export async function getActiveQueryVersion() {
  const resp = await authFetch(`${API_BASE}/queries/active`);
  if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
  return await resp.json();
}

export async function saveQueryVersion({ versionTag, title, queryText, description = '', setActive = false }) {
  const resp = await authFetch(`${API_BASE}/queries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ versionTag, title, queryText, description, setActive })
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `HTTP error ${resp.status}`);
  }
  return await resp.json();
}

export async function activateQueryVersion(id) {
  const resp = await authFetch(`${API_BASE}/queries/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `HTTP error ${resp.status}`);
  }
  return await resp.json();
}

export async function updateQueryVersion({ id, versionTag, title, queryText, description }) {
  const resp = await authFetch(`${API_BASE}/queries/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, versionTag, title, queryText, description })
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `HTTP error ${resp.status}`);
  }
  return await resp.json();
}

export async function deleteQueryVersion(id) {
  const resp = await authFetch(`${API_BASE}/queries/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `HTTP error ${resp.status}`);
  }
  return await resp.json();
}