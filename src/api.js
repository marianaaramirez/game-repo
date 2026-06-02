/**
 * api.js
 * Frontend API client for the Math Smash backend.
 * All calls automatically attach the JWT from localStorage when present.
 * Network failures are caught and logged — they never throw past the caller,
 * so missing the backend never breaks gameplay.
 */

const BASE_URL = 'http://localhost:3000/api';
const TOKEN_KEY = 'mathsmash_token';

// --- Token storage ---
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Generic fetch wrapper. Adds JSON headers + bearer token when available.
 * @returns {Promise<object|null>} Parsed JSON, or null on network failure.
 */
async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token   = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res  = await fetch(`${BASE_URL}${path}`, opts);
    const data = res.status === 204 ? null : await res.json();
    if (!res.ok) {
      console.warn(`[api] ${method} ${path} -> ${res.status}`, data);
      return { ok: false, status: res.status, error: data?.error || 'request failed' };
    }
    // Wrap response: data lives on `.data` regardless of object/array type.
    return { ok: true, status: res.status, data };
  } catch (err) {
    console.warn(`[api] ${method} ${path} network error:`, err.message);
    return { ok: false, status: 0, error: err.message };
  }
}

// --- Auth ---
export const register = (username, password) => request('POST', '/register', { username, password });
export const login    = (username, password) => request('POST', '/login',    { username, password });
export const getMe    = ()                   => request('GET',  '/me');

// --- Catalog (public) ---
export const getMaps    = ()              => request('GET', '/maps');
export const getCards   = (world, type)   => request('GET', `/cards?world=${world}${type ? `&type=${type}` : ''}`);
export const getEnemies = (world)         => request('GET', `/enemies${world ? `?world=${world}` : ''}`);

// --- Runs ---
export const createRun = (world_level, skin_selected)     => request('POST', '/run', { world_level, skin_selected });
export const updateRun = (runID, fields)                  => request('PUT',  `/run/${runID}`, fields);
export const getRun    = (runID)                          => request('GET',  `/run/${runID}`);

// --- Combat / problems ---
export const postProblem = (data) => request('POST', '/problem', data);
export const postCombat  = (data) => request('POST', '/combat',  data);

// --- Stats ---
export const getStats       = ()  => request('GET', '/stats');
export const getLeaderboard = ()  => request('GET', '/leaderboard');

// --- Skill deck (roguelike persistence) ---
export const getSkillDeck     = ()        => request('GET',    '/skill-deck');
export const addSkillCard     = (cardID)  => request('POST',   '/skill-deck', { cardID });
export const equipSkillCard   = (cardID)  => request('PUT',    '/skill-deck/equip', { cardID });
export const unequipSkillCard = ()        => request('DELETE', '/skill-deck/equip');

// --- Player profile (derived data) ---
export const getProfile = () => request('GET', '/player/me/profile');

// --- Pause / resume (run snapshots) ---
export const saveRun       = (runID, state) => request('PUT',    `/run/${runID}/save`, { state });
export const loadRunSave   = (runID)        => request('GET',    `/run/${runID}/save`);
export const listSavedRuns = ()             => request('GET',    '/saved-runs');
export const deleteRunSave = (runID)        => request('DELETE', `/run/${runID}/save`);

// --- Deck collection (cross-session persistence) ---
export const getDeck            = ()                          => request('GET',    '/deck');
export const addDeckCard        = (cardID, isActive = false)  => request('POST',   '/deck/cards', { cardID, is_active: isActive });
export const setDeckCardActive  = (deckCardID, isActive)      => request('PUT',    `/deck/cards/${deckCardID}/active`, { is_active: isActive });
export const wipeDeck           = ()                          => request('DELETE', '/deck');

/**
 * Fetch all enemies + all cards and build name -> ID lookup maps.
 * Cached in window.__catalog for fast lookup during combat.
 */
export async function bootstrapCatalog() {
  const [enemiesRes, cardsW1, cardsW2, cardsW3, cardsSkill] = await Promise.all([
    getEnemies(),
    getCards(1),
    getCards(2),
    getCards(3),
    getCards(0, 'skill'),
  ]);

  const enemyByName = {};
  if (enemiesRes.ok && Array.isArray(enemiesRes.data)) {
    enemiesRes.data.forEach((e) => { enemyByName[e.name] = e.enemyID; });
  }

  const cardByName = {};
  [cardsW1, cardsW2, cardsW3, cardsSkill].forEach((res) => {
    if (res.ok && Array.isArray(res.data)) {
      res.data.forEach((c) => { cardByName[c.name] = c.cardID; });
    }
  });

  window.__catalog = { enemyByName, cardByName };
  return window.__catalog;
}

export function getEnemyIDByName(name) {
  return window.__catalog?.enemyByName?.[name] || null;
}
export function getCardIDByName(name) {
  return window.__catalog?.cardByName?.[name] || null;
}
