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
// SKILL DECK
// ------------------------------------------------------------
test('SETUP — fetch skill cardIDs from catalog', async () => {
  const res = await http('GET', '/cards?type=skill');
  assert.equal(res.status, 200);
  assert.ok(res.data.length >= 2, 'need at least 2 skill cards for equip-switch test');
  state.skillCardA = res.data[0].cardID;
  state.skillCardB = res.data[1].cardID;
  // Also grab any attack card to test non-skill rejection
  const atk = await http('GET', '/cards?type=attack');
  state.attackCardID = atk.data[0].cardID;
});

test('GET /skill-deck — requires auth', async () => {
  const res = await http('GET', '/skill-deck');
  assert.equal(res.status, 401);
});

test('GET /skill-deck — empty for new player', async () => {
  const res = await http('GET', '/skill-deck', null, state.token);
  assert.equal(res.status, 200);
  assert.deepEqual(res.data, []);
});

test('POST /skill-deck — requires auth', async () => {
  const res = await http('POST', '/skill-deck', { cardID: state.skillCardA });
  assert.equal(res.status, 401);
});

test('POST /skill-deck — rejects missing cardID', async () => {
  const res = await http('POST', '/skill-deck', {}, state.token);
  assert.equal(res.status, 400);
});

test('POST /skill-deck — rejects non-existent cardID', async () => {
  const res = await http('POST', '/skill-deck', { cardID: 999999 }, state.token);
  assert.equal(res.status, 404);
});

test('POST /skill-deck — rejects non-skill cardID', async () => {
  const res = await http('POST', '/skill-deck', { cardID: state.attackCardID }, state.token);
  assert.equal(res.status, 400);
  assert.ok(/not a skill/i.test(res.data.error));
});

test('POST /skill-deck — unlocks skill card', async () => {
  const res = await http('POST', '/skill-deck', { cardID: state.skillCardA }, state.token);
  assert.equal(res.status, 201);
  assert.ok(res.data.skillDeckID);
  assert.equal(res.data.cardID, state.skillCardA);
  assert.equal(!!res.data.is_equipped, false);
  state.skillDeckIDA = res.data.skillDeckID;
});

test('POST /skill-deck — idempotent on duplicate', async () => {
  const res = await http('POST', '/skill-deck', { cardID: state.skillCardA }, state.token);
  assert.ok(res.status === 201 || res.status === 200);
  // Same row returned
  assert.equal(res.data.skillDeckID, state.skillDeckIDA);
});

test('GET /skill-deck — returns owned skill cards with Card join', async () => {
  const res = await http('GET', '/skill-deck', null, state.token);
  assert.equal(res.status, 200);
  assert.equal(res.data.length, 1);
  assert.equal(res.data[0].cardID, state.skillCardA);
  assert.ok(res.data[0].name);          // joined from Card
  assert.ok(res.data[0].description);   // joined from Card
});

test('PUT /skill-deck/equip — requires auth', async () => {
  const res = await http('PUT', '/skill-deck/equip', { cardID: state.skillCardA });
  assert.equal(res.status, 401);
});

test('PUT /skill-deck/equip — rejects non-owned cardID', async () => {
  const res = await http('PUT', '/skill-deck/equip', { cardID: state.skillCardB }, state.token);
  assert.equal(res.status, 404);
});

test('PUT /skill-deck/equip — equips owned skill', async () => {
  const res = await http('PUT', '/skill-deck/equip', { cardID: state.skillCardA }, state.token);
  assert.equal(res.status, 200);
  assert.equal(res.data.equipped, state.skillCardA);

  // Verify via GET
  const check = await http('GET', '/skill-deck', null, state.token);
  const row = check.data.find((r) => r.cardID === state.skillCardA);
  assert.ok(row);
  assert.equal(!!row.is_equipped, true);
});

test('PUT /skill-deck/equip — switching unequips the previous one', async () => {
  // Unlock the second skill card
  await http('POST', '/skill-deck', { cardID: state.skillCardB }, state.token);
  // Equip it
  const res = await http('PUT', '/skill-deck/equip', { cardID: state.skillCardB }, state.token);
  assert.equal(res.status, 200);
  assert.equal(res.data.equipped, state.skillCardB);

  // The previous one (A) must now be unequipped
  const check = await http('GET', '/skill-deck', null, state.token);
  const a = check.data.find((r) => r.cardID === state.skillCardA);
  const b = check.data.find((r) => r.cardID === state.skillCardB);
  assert.equal(!!a.is_equipped, false);
  assert.equal(!!b.is_equipped, true);
});

test('DELETE /skill-deck/equip — unequips all', async () => {
  const res = await http('DELETE', '/skill-deck/equip', null, state.token);
  assert.equal(res.status, 200);
  assert.equal(res.data.equipped, null);

  // Verify no cards are equipped
  const check = await http('GET', '/skill-deck', null, state.token);
  check.data.forEach((r) => assert.equal(!!r.is_equipped, false));
});

// ------------------------------------------------------------
// PAUSE / RESUME — RunSave snapshots
// ------------------------------------------------------------
test('PUT /run/:id/save — requires auth', async () => {
  const res = await http('PUT', `/run/${state.runID}/save`, { state: { foo: 1 } });
  assert.equal(res.status, 401);
});

test('PUT /run/:id/save — rejects missing state', async () => {
  const res = await http('PUT', `/run/${state.runID}/save`, {}, state.token);
  assert.equal(res.status, 400);
});

test('PUT /run/:id/save — rejects non-numeric runID', async () => {
  const res = await http('PUT', '/run/abc/save', { state: { x: 1 } }, state.token);
  assert.equal(res.status, 400);
});

test('PUT /run/:id/save — rejects non-existent runID', async () => {
  const res = await http('PUT', '/run/999999/save', { state: { x: 1 } }, state.token);
  assert.equal(res.status, 404);
});

test('PUT /run/:id/save — saves a state snapshot', async () => {
  const snapshot = {
    world_level: 1,
    enemies_defeated: 2,
    duration_so_far: 90,
    player: { hp: 80, maxHp: 100, level: 2, skinIndex: 1 },
    map: { currentNode: 3, completedNodes: [0, 1] },
  };
  const res = await http('PUT', `/run/${state.runID}/save`, { state: snapshot }, state.token);
  assert.equal(res.status, 200);
  assert.equal(res.data.saved, true);
  assert.equal(res.data.runID, state.runID);
});

test('GET /run/:id/save — requires auth', async () => {
  const res = await http('GET', `/run/${state.runID}/save`);
  assert.equal(res.status, 401);
});

test('GET /run/:id/save — returns saved snapshot', async () => {
  const res = await http('GET', `/run/${state.runID}/save`, null, state.token);
  assert.equal(res.status, 200);
  assert.equal(res.data.runID, state.runID);
  assert.ok(res.data.state);
  assert.equal(res.data.state.enemies_defeated, 2);
  assert.equal(res.data.state.player.hp, 80);
  assert.deepEqual(res.data.state.map.completedNodes, [0, 1]);
  assert.ok(res.data.saved_at);
});

test('PUT /run/:id/save — upsert overwrites existing save', async () => {
  const newSnap = {
    world_level: 1,
    enemies_defeated: 4,
    player: { hp: 50, maxHp: 100, level: 3, skinIndex: 1 },
  };
  await http('PUT', `/run/${state.runID}/save`, { state: newSnap }, state.token);
  const res = await http('GET', `/run/${state.runID}/save`, null, state.token);
  assert.equal(res.data.state.enemies_defeated, 4);
  assert.equal(res.data.state.player.hp, 50);
});

test('GET /saved-runs — requires auth', async () => {
  const res = await http('GET', '/saved-runs');
  assert.equal(res.status, 401);
});

test('GET /saved-runs — lists ongoing runs with saves', async () => {
  const res = await http('GET', '/saved-runs', null, state.token);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data));
  const me = res.data.find((r) => r.runID === state.runID);
  assert.ok(me, 'expected our test run in saved-runs');
  assert.equal(me.world_level, 1);
  assert.ok(me.saved_at);
});

test('GET /run/:id/save — non-owner gets 403', async () => {
  // Register a second user to verify ownership check
  const otherUser = `intruder_${Date.now()}`;
  const reg = await http('POST', '/register', {
    username: otherUser, password: 'pass1234',
  });
  const otherToken = reg.data.token;
  const res = await http('GET', `/run/${state.runID}/save`, null, otherToken);
  assert.equal(res.status, 403);
  state.otherToken = otherToken;
});

test('DELETE /run/:id/save — requires auth', async () => {
  const res = await http('DELETE', `/run/${state.runID}/save`);
  assert.equal(res.status, 401);
});

test('DELETE /run/:id/save — non-owner gets 403', async () => {
  const res = await http('DELETE', `/run/${state.runID}/save`, null, state.otherToken);
  assert.equal(res.status, 403);
});

test('DELETE /run/:id/save — wipes the save', async () => {
  const res = await http('DELETE', `/run/${state.runID}/save`, null, state.token);
  assert.equal(res.status, 200);
  assert.equal(res.data.deleted, true);
});

test('GET /run/:id/save — 404 after delete', async () => {
  const res = await http('GET', `/run/${state.runID}/save`, null, state.token);
  assert.equal(res.status, 404);
});

test('GET /saved-runs — no longer includes our run', async () => {
  const res = await http('GET', '/saved-runs', null, state.token);
  const me = res.data.find((r) => r.runID === state.runID);
  assert.equal(me, undefined);
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

// ------------------------------------------------------------
// PLAYER PROFILE
// ------------------------------------------------------------
test('GET /player/me/profile — requires auth', async () => {
  const res = await http('GET', '/player/me/profile');
  assert.equal(res.status, 401);
});

test('GET /player/me/profile — returns lastSkin + clearedLevels', async () => {
  const res = await http('GET', '/player/me/profile', null, state.token);
  assert.equal(res.status, 200);
  assert.equal(res.data.playerID, state.playerID);
  assert.equal(res.data.username, state.username);
  // We created the run with skin_selected=0 earlier
  assert.equal(res.data.lastSkin, 0);
  // And marked it as won (world 1)
  assert.ok(Array.isArray(res.data.clearedLevels));
  assert.ok(res.data.clearedLevels.includes(1));
});

// ------------------------------------------------------------
// DECK COLLECTION
// ------------------------------------------------------------
test('SETUP — fetch attack/defense cardIDs from catalog', async () => {
  const atk = await http('GET', '/cards?type=attack');
  const def = await http('GET', '/cards?type=defense');
  assert.ok(atk.data.length > 0);
  assert.ok(def.data.length > 0);
  state.deckAttackCardID  = atk.data[0].cardID;
  state.deckDefenseCardID = def.data[0].cardID;
  // Find a skill card too — used for rejection test
  const skl = await http('GET', '/cards?type=skill');
  state.deckSkillCardID = skl.data[0].cardID;
});

test('GET /deck — requires auth', async () => {
  const res = await http('GET', '/deck');
  assert.equal(res.status, 401);
});

test('GET /deck — empty for fresh player', async () => {
  const res = await http('GET', '/deck', null, state.token);
  assert.equal(res.status, 200);
  assert.deepEqual(res.data, []);
});

test('POST /deck/cards — requires auth', async () => {
  const res = await http('POST', '/deck/cards', { cardID: state.deckAttackCardID });
  assert.equal(res.status, 401);
});

test('POST /deck/cards — rejects missing cardID', async () => {
  const res = await http('POST', '/deck/cards', {}, state.token);
  assert.equal(res.status, 400);
});

test('POST /deck/cards — rejects non-existent cardID', async () => {
  const res = await http('POST', '/deck/cards', { cardID: 999999 }, state.token);
  assert.equal(res.status, 404);
});

test('POST /deck/cards — rejects skill card', async () => {
  const res = await http('POST', '/deck/cards', { cardID: state.deckSkillCardID }, state.token);
  assert.equal(res.status, 400);
  assert.ok(/skill-deck/i.test(res.data.error));
});

test('POST /deck/cards — adds attack card to collection', async () => {
  const res = await http('POST', '/deck/cards', {
    cardID:    state.deckAttackCardID,
    is_active: true,
  }, state.token);
  assert.equal(res.status, 201);
  assert.ok(res.data.deckCardID);
  assert.equal(res.data.cardID, state.deckAttackCardID);
  assert.equal(res.data.is_active, true);
  state.deckCardID_A = res.data.deckCardID;
});

test('POST /deck/cards — same cardID creates a second instance', async () => {
  const res = await http('POST', '/deck/cards', {
    cardID:    state.deckAttackCardID,
    is_active: false,
  }, state.token);
  assert.equal(res.status, 201);
  // Different deckCardID — each copy is its own row
  assert.notEqual(res.data.deckCardID, state.deckCardID_A);
  state.deckCardID_B = res.data.deckCardID;
});

test('POST /deck/cards — adds defense card too', async () => {
  const res = await http('POST', '/deck/cards', {
    cardID: state.deckDefenseCardID,
  }, state.token);
  assert.equal(res.status, 201);
  state.deckCardID_C = res.data.deckCardID;
});

test('GET /deck — lists all owned cards with Card join', async () => {
  const res = await http('GET', '/deck', null, state.token);
  assert.equal(res.status, 200);
  assert.equal(res.data.length, 3);
  res.data.forEach((row) => {
    assert.ok(row.name);
    assert.ok(['attack', 'defense'].includes(row.type));
    assert.ok(typeof row.power_value === 'number');
    assert.ok(row.special);
  });
  // One should be is_active=true (the first attack copy)
  const active = res.data.filter((r) => r.is_active);
  assert.equal(active.length, 1);
  assert.equal(active[0].deckCardID, state.deckCardID_A);
});

test('PUT /deck/cards/:id/active — requires auth', async () => {
  const res = await http('PUT', `/deck/cards/${state.deckCardID_A}/active`, { is_active: false });
  assert.equal(res.status, 401);
});

test('PUT /deck/cards/:id/active — rejects missing boolean', async () => {
  const res = await http('PUT', `/deck/cards/${state.deckCardID_A}/active`, {}, state.token);
  assert.equal(res.status, 400);
});

test('PUT /deck/cards/:id/active — rejects non-owned deckCardID', async () => {
  const res = await http('PUT', '/deck/cards/999999/active', { is_active: true }, state.token);
  assert.equal(res.status, 404);
});

test('PUT /deck/cards/:id/active — toggles is_active off', async () => {
  const res = await http('PUT', `/deck/cards/${state.deckCardID_A}/active`,
    { is_active: false }, state.token);
  assert.equal(res.status, 200);
  assert.equal(res.data.is_active, false);

  // Verify via GET
  const check = await http('GET', '/deck', null, state.token);
  const row = check.data.find((r) => r.deckCardID === state.deckCardID_A);
  assert.equal(!!row.is_active, false);
});

test('PUT /deck/cards/:id/active — toggles is_active on for a different copy', async () => {
  const res = await http('PUT', `/deck/cards/${state.deckCardID_B}/active`,
    { is_active: true }, state.token);
  assert.equal(res.status, 200);
  assert.equal(res.data.is_active, true);
});

test('PUT /deck/cards/:id/active — enforces max 4 active cap', async () => {
  // Reset known state: ensure only 1 active card (B from earlier test)
  // Add 4 more cards so collection has 5 inactive + 1 active = 6 total
  const newIDs = [];
  for (let i = 0; i < 4; i++) {
    const r = await http('POST', '/deck/cards', {
      cardID: state.deckAttackCardID,
      is_active: false,
    }, state.token);
    newIDs.push(r.data.deckCardID);
  }

  // Activate 3 of them → with B already active = 4 total active (at cap)
  for (let i = 0; i < 3; i++) {
    const r = await http('PUT', `/deck/cards/${newIDs[i]}/active`,
      { is_active: true }, state.token);
    assert.equal(r.status, 200);
  }

  // Attempt to activate a 5th card → should be rejected with 409
  const overCap = await http('PUT', `/deck/cards/${newIDs[3]}/active`,
    { is_active: true }, state.token);
  assert.equal(overCap.status, 409);
  assert.ok(/4 active cards/i.test(overCap.data.error));

  // Deactivating still works even when at the cap
  const deactivate = await http('PUT', `/deck/cards/${newIDs[0]}/active`,
    { is_active: false }, state.token);
  assert.equal(deactivate.status, 200);

  // Now activating the 5th should succeed (cap freed)
  const retry = await http('PUT', `/deck/cards/${newIDs[3]}/active`,
    { is_active: true }, state.token);
  assert.equal(retry.status, 200);
});

test('DELETE /deck — requires auth', async () => {
  const res = await http('DELETE', '/deck');
  assert.equal(res.status, 401);
});

test('DELETE /deck — wipes the collection', async () => {
  const res = await http('DELETE', '/deck', null, state.token);
  assert.equal(res.status, 200);
  assert.equal(res.data.wiped, true);

  // Verify empty
  const check = await http('GET', '/deck', null, state.token);
  assert.deepEqual(check.data, []);
});

test('DELETE /deck — does NOT wipe skill cards', async () => {
  // From earlier skill-deck tests we owned 2 skill cards
  const check = await http('GET', '/skill-deck', null, state.token);
  assert.equal(check.status, 200);
  assert.ok(check.data.length >= 1, 'skill cards should survive deck wipe');
});

after(() => {
  console.log('\n[cleanup] test user remains in DB:', state.username);
  console.log('          (drop manually if needed: DELETE FROM Player WHERE username=?)');
});
