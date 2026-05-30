/**
 * api.test.js
 * Integration tests for the Math Smash backend API.
 * Uses Node's built-in test runner (Node 18+) + global fetch.
 *
 * Run:  npm run test:api
 *
 * Prerequisites:
 *  - Backend server running on http://localhost:3000
 *  - MySQL DB with schemaV3 + seeds applied
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

const BASE = 'http://localhost:3000/api';

// Test session state — shared across tests
const state = {
  username: `testuser_${Date.now()}`,
  password: 'test1234',
  token:    null,
  playerID: null,
  runID:    null,
  problemID: null,
  combatID: null,
};

// ------------------------------------------------------------
// HTTP helpers
// ------------------------------------------------------------
async function http(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res  = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}

// ============================================================
// Tests
// ============================================================

before(async () => {
  // Verify server is up before running anything
  const res = await http('GET', '/health');
  if (res.status !== 200) {
    throw new Error(`Backend not reachable at ${BASE}. Start with: npm run server:dev`);
  }
  console.log(`[setup] backend healthy, using username: ${state.username}`);
});

// ------------------------------------------------------------
// AUTH
// ------------------------------------------------------------
test('POST /register — rejects short password', async () => {
  const res = await http('POST', '/register', { username: state.username, password: '123' });
  assert.equal(res.status, 400);
  assert.ok(/at least 6 characters/.test(res.data.error));
});

test('POST /register — rejects missing fields', async () => {
  const res = await http('POST', '/register', { username: state.username });
  assert.equal(res.status, 400);
});

test('POST /register — creates new player', async () => {
  const res = await http('POST', '/register', { username: state.username, password: state.password });
  assert.equal(res.status, 201);
  assert.ok(res.data.token);
  assert.ok(res.data.playerID);
  assert.equal(res.data.username, state.username);
  state.token    = res.data.token;
  state.playerID = res.data.playerID;
});

test('POST /register — rejects duplicate username', async () => {
  const res = await http('POST', '/register', { username: state.username, password: state.password });
  assert.equal(res.status, 409);
});

test('POST /login — rejects wrong password', async () => {
  const res = await http('POST', '/login', { username: state.username, password: 'wrongpass' });
  assert.equal(res.status, 401);
});

test('POST /login — accepts correct credentials', async () => {
  const res = await http('POST', '/login', { username: state.username, password: state.password });
  assert.equal(res.status, 200);
  assert.ok(res.data.token);
  assert.equal(res.data.playerID, state.playerID);
});

test('GET /me — rejects missing token', async () => {
  const res = await http('GET', '/me');
  assert.equal(res.status, 401);
});

test('GET /me — rejects invalid token', async () => {
  const res = await http('GET', '/me', null, 'invalid.jwt.token');
  assert.equal(res.status, 401);
});

test('GET /me — returns current player', async () => {
  const res = await http('GET', '/me', null, state.token);
  assert.equal(res.status, 200);
  assert.equal(res.data.username, state.username);
  assert.equal(res.data.playerID, state.playerID);
});

// ------------------------------------------------------------
// CATALOG (public)
// ------------------------------------------------------------
test('GET /maps — returns 3 worlds', async () => {
  const res = await http('GET', '/maps');
  assert.equal(res.status, 200);
  assert.equal(res.data.length, 3);
  assert.equal(res.data[0].world_level, 1);
});

test('GET /cards?world=1 — returns world 1 cards', async () => {
  const res = await http('GET', '/cards?world=1');
  assert.equal(res.status, 200);
  assert.ok(res.data.length > 0);
  res.data.forEach((c) => assert.equal(c.world_level, 1));
});

test('GET /cards?world=1&type=attack — filters by type', async () => {
  const res = await http('GET', '/cards?world=1&type=attack');
  assert.equal(res.status, 200);
  res.data.forEach((c) => {
    assert.equal(c.world_level, 1);
    assert.equal(c.type, 'attack');
  });
});

test('GET /cards — rejects invalid type', async () => {
  const res = await http('GET', '/cards?type=invalid');
  assert.equal(res.status, 400);
});

test('GET /enemies?world=1&type=basic — returns basic enemies', async () => {
  const res = await http('GET', '/enemies?world=1&type=basic');
  assert.equal(res.status, 200);
  assert.equal(res.data.length, 6); // Slime, Spider, Skeleton, Golem, Predator Plant, Evil Bat
  res.data.forEach((e) => {
    assert.equal(e.type, 'basic');
    assert.ok(e.hp > 0);
    assert.ok(e.attack_power > 0);
  });
});

test('GET /enemies?type=boss — returns 3 bosses', async () => {
  const res = await http('GET', '/enemies?type=boss');
  assert.equal(res.status, 200);
  assert.equal(res.data.length, 3);
});

// ------------------------------------------------------------
// RUN
// ------------------------------------------------------------
test('POST /run — requires auth', async () => {
  const res = await http('POST', '/run', { world_level: 1, skin_selected: 0 });
  assert.equal(res.status, 401);
});

test('POST /run — rejects invalid world_level', async () => {
  const res = await http('POST', '/run', { world_level: 5, skin_selected: 0 }, state.token);
  assert.equal(res.status, 400);
});

test('POST /run — rejects invalid skin_selected', async () => {
  const res = await http('POST', '/run', { world_level: 1, skin_selected: 7 }, state.token);
  assert.equal(res.status, 400);
});

test('POST /run — creates new run', async () => {
  const res = await http('POST', '/run', { world_level: 1, skin_selected: 0 }, state.token);
  assert.equal(res.status, 201);
  assert.ok(res.data.runID);
  state.runID = res.data.runID;
});

test('GET /run/:id — returns owned run', async () => {
  const res = await http('GET', `/run/${state.runID}`, null, state.token);
  assert.equal(res.status, 200);
  assert.equal(res.data.runID, state.runID);
  assert.equal(res.data.world_level, 1);
});

test('GET /runs — lists player runs', async () => {
  const res = await http('GET', '/runs', null, state.token);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data));
  assert.ok(res.data.length >= 1);
});

test('PUT /run/:id — partial update works', async () => {
  const res = await http('PUT', `/run/${state.runID}`, { enemies_defeated: 2 }, state.token);
  assert.equal(res.status, 200);
  assert.equal(res.data.enemies_defeated, 2);
});

test('PUT /run/:id — rejects invalid result', async () => {
  const res = await http('PUT', `/run/${state.runID}`, { result: 'bogus' }, state.token);
  assert.equal(res.status, 400);
});

// ------------------------------------------------------------
// PROBLEM
// ------------------------------------------------------------
test('POST /problem — requires auth', async () => {
  const res = await http('POST', '/problem', { runID: state.runID });
  assert.equal(res.status, 401);
});

test('POST /problem — rejects missing fields', async () => {
  const res = await http('POST', '/problem', { runID: state.runID }, state.token);
  assert.equal(res.status, 400);
});

test('POST /problem — logs math problem', async () => {
  const res = await http('POST', '/problem', {
    runID:         state.runID,
    world_level:   1,
    battle_number: 1,
    difficulty:    'tier_1',
    op_type:       'addition',
    expression:    '5 + 3',
    answer:        8,
    player_answer: 8,
    response_time: 2500,
    is_correct:    true,
  }, state.token);
  assert.equal(res.status, 201);
  assert.ok(res.data.problemID);
  state.problemID = res.data.problemID;
});

// ------------------------------------------------------------
// COMBAT
// ------------------------------------------------------------
test('POST /combat — requires auth', async () => {
  const res = await http('POST', '/combat', { runID: state.runID, enemyID: 1 });
  assert.equal(res.status, 401);
});

test('POST /combat — rejects invalid timer_result', async () => {
  const res = await http('POST', '/combat', {
    runID: state.runID, enemyID: 1, timer_result: 'purple',
  }, state.token);
  assert.equal(res.status, 400);
});

test('POST /combat — logs combat with cards', async () => {
  const res = await http('POST', '/combat', {
    runID:         state.runID,
    enemyID:       1,
    problemID:     state.problemID,
    timer_result:  'green',
    damage_dealt:  10,
    combat_result: 'win',
    cards_used:    [{ cardID: 1, turn_number: 1 }],
  }, state.token);
  assert.equal(res.status, 201);
  assert.ok(res.data.combatID);
  state.combatID = res.data.combatID;
});

// ------------------------------------------------------------
// STATS
// ------------------------------------------------------------
test('GET /stats — requires auth', async () => {
  const res = await http('GET', '/stats');
  assert.equal(res.status, 401);
});

test('GET /stats — returns aggregated stats', async () => {
  const res = await http('GET', '/stats', null, state.token);
  assert.equal(res.status, 200);
  assert.ok(res.data.totalRuns >= 1);
  assert.ok(res.data.totalProblems >= 1);
  assert.equal(res.data.correctProblems, 1);
  assert.equal(typeof res.data.winRate, 'number');
  assert.equal(typeof res.data.accuracy, 'number');
  assert.ok(Array.isArray(res.data.byWorld));
  // The world 1 entry should have at least 1 run
  const w1 = res.data.byWorld.find((w) => w.world_level === 1);
  assert.ok(w1, 'expected world 1 in byWorld breakdown');
  assert.ok(w1.runs >= 1);
});

test('GET /leaderboard — returns top players list', async () => {
  const res = await http('GET', '/leaderboard');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data));
  // Our test user should appear somewhere
  const me = res.data.find((p) => p.playerID === state.playerID);
  assert.ok(me, 'expected test user in leaderboard');
});

// ------------------------------------------------------------
// FINAL — finish run as win, verify stats update
// ------------------------------------------------------------
test('PUT /run/:id — marks run as won + sets duration', async () => {
  const res = await http('PUT', `/run/${state.runID}`, {
    result:   'win',
    duration: 180,
    enemies_defeated: 5,
  }, state.token);
  assert.equal(res.status, 200);
  assert.equal(res.data.result, 'win');
  assert.equal(res.data.duration, 180);
});

test('GET /stats — reflects win after run completion', async () => {
  const res = await http('GET', '/stats', null, state.token);
  assert.equal(res.status, 200);
  assert.ok(res.data.wins >= 1);
  assert.equal(res.data.highestWorldCleared, 1);
});

after(() => {
  console.log('\n[cleanup] test user remains in DB:', state.username);
  console.log('          (drop manually if needed: DELETE FROM Player WHERE username=?)');
});
