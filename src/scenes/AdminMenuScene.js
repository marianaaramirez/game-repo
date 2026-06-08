/**
 * AdminMenuScene.js
 * Administrator analytics dashboard. Fetches global stats once from
 * GET /api/admin/stats, then shows a left-hand menu of 5 reports. Clicking a
 * menu item renders the matching panel on the right.
 *
 * Reports:
 *   COMBATS       — wins vs losses across all players' combats
 *   ANSWERS       — correct vs incorrect across all answered problems
 *   AVG TIME      — average time to answer a math problem
 *   ENEMY BALANCE — apparition % of each enemy across all combats
 *   CHEST BALANCE — configured drop rates for chest outcomes
 *
 * Navigation:
 *   LOGOUT → clears admin token → LoginScene
 */

import Phaser from 'phaser';
import { adminGetStats, adminGetPlayers, clearAdminToken } from '../api.js';

const SECTIONS = [
  { key: 'combats',     label: 'COMBATS' },
  { key: 'answers',     label: 'ANSWERS' },
  { key: 'avgtime',     label: 'AVG TIME' },
  { key: 'enemies',     label: 'ENEMY BALANCE' },
  { key: 'chests',      label: 'CHEST BALANCE' },
  { key: 'leaderboard', label: 'LEADERBOARD' },
];

const PANEL_X = 520; // center X of the right panel content area

export default class AdminMenuScene extends Phaser.Scene {
  constructor() {
    super('AdminMenuScene');
  }

  init(data) {
    this.section = (data && data.section) || 'combats';
  }

  async create() {
    this.cameras.main.setBackgroundColor('#0f1424');
    this.panelObjects = [];

    const adminName = this.registry.get('adminUsername') || 'admin';

    // Header
    this.add.text(400, 32, 'ADMIN DASHBOARD', {
      fontSize: '26px', fontFamily: 'Arial Black', color: '#66ccff',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);
    this.add.text(400, 58, `Signed in as ${adminName}  -  global stats (all players)`, {
      fontSize: '12px', fontFamily: 'Arial', color: '#8899bb',
    }).setOrigin(0.5);

    // Logout button (top-right)
    const logoutBg = this.add.rectangle(730, 30, 110, 30, 0xaa3333, 0.9)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0xff5555);
    this.add.text(730, 30, 'LOGOUT', {
      fontSize: '13px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);
    logoutBg.on('pointerdown', () => {
      clearAdminToken();
      this.registry.set('adminUsername', null);
      this.scene.start('LoginScene');
    });

    // Left menu buttons
    this.menuButtons = {};
    SECTIONS.forEach((s, i) => {
      const y = 130 + i * 56;
      const active = s.key === this.section;
      const bg = this.add.rectangle(140, y, 220, 46, active ? 0x3377cc : 0x252b40, 0.95)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, active ? 0x66ccff : 0x444466);
      const txt = this.add.text(140, y, s.label, {
        fontSize: '15px', fontFamily: 'Arial Black', color: active ? '#ffffff' : '#aabbdd',
      }).setOrigin(0.5);
      bg.on('pointerover', () => { if (s.key !== this.section) bg.setFillStyle(0x303755, 1); });
      bg.on('pointerout',  () => { if (s.key !== this.section) bg.setFillStyle(0x252b40, 0.95); });
      bg.on('pointerdown', () => this.switchSection(s.key));
      this.menuButtons[s.key] = bg;
    });

    // Divider
    this.add.rectangle(280, 300, 2, 420, 0x333355).setOrigin(0.5);

    // Loading text in panel
    this.statusText = this.add.text(PANEL_X, 300, 'Loading...', {
      fontSize: '16px', fontFamily: 'Arial', color: '#8899bb',
    }).setOrigin(0.5);

    // Leaderboard needs the player list; the other sections need global stats.
    if (this.section === 'leaderboard') {
      const res = await adminGetPlayers();
      if (!res.ok) {
        this.statusText.setText(`Failed to load players:\n${res.error || 'unknown error'}`)
          .setColor('#ff6666').setAlign('center');
        return;
      }
      this.players = res.data;
      this.statusText.setVisible(false);
      this.renderPanel();
      return;
    }

    const res = await adminGetStats();
    if (!res.ok) {
      this.statusText.setText(`Failed to load stats:\n${res.error || 'unknown error'}`)
        .setColor('#ff6666').setAlign('center');
      return;
    }
    this.stats = res.data;
    this.statusText.setVisible(false);
    this.renderPanel();
  }

  switchSection(key) {
    if (key === this.section) return;
    // Keep cached stats by restarting with the new section; create() refetches.
    this.scene.restart({ section: key });
  }

  // ============================================================
  // Panel rendering
  // ============================================================

  clearPanel() {
    this.panelObjects.forEach((o) => o.destroy());
    this.panelObjects = [];
  }

  add2(obj) {
    this.panelObjects.push(obj);
    return obj;
  }

  panelTitle(title) {
    this.add2(this.add.text(PANEL_X, 110, title, {
      fontSize: '20px', fontFamily: 'Arial Black', color: '#ffcc00',
    }).setOrigin(0.5));
  }

  renderPanel() {
    this.clearPanel();
    switch (this.section) {
      case 'combats':     return this.renderCombats();
      case 'answers':     return this.renderAnswers();
      case 'avgtime':     return this.renderAvgTime();
      case 'enemies':     return this.renderEnemies();
      case 'chests':      return this.renderChests();
      case 'leaderboard': return this.renderLeaderboard();
    }
  }

  /** Big number + label helper, vertically stacked at (x, y). */
  bigStat(x, y, value, label, color) {
    this.add2(this.add.text(x, y, String(value), {
      fontSize: '40px', fontFamily: 'Arial Black', color,
    }).setOrigin(0.5));
    this.add2(this.add.text(x, y + 34, label, {
      fontSize: '13px', fontFamily: 'Arial', color: '#aabbcc',
    }).setOrigin(0.5));
  }

  /** Horizontal proportion bar (two-segment) at center PANEL_X. */
  ratioBar(y, leftVal, rightVal, leftColor, rightColor) {
    const width = 420;
    const total = leftVal + rightVal;
    const left  = total > 0 ? (leftVal / total) * width : width / 2;
    const x0    = PANEL_X - width / 2;

    this.add2(this.add.rectangle(x0, y, width, 26, 0x222a40).setOrigin(0, 0.5).setStrokeStyle(1, 0x444466));
    if (total > 0) {
      this.add2(this.add.rectangle(x0, y, left, 26, leftColor).setOrigin(0, 0.5));
      this.add2(this.add.rectangle(x0 + left, y, width - left, 26, rightColor).setOrigin(0, 0.5));
    }
  }

  renderCombats() {
    const c = this.stats.combats;
    this.panelTitle('COMBATS  —  Wins vs Losses');

    this.bigStat(PANEL_X - 140, 200, c.wins,   'WINS',   '#44ff44');
    this.bigStat(PANEL_X,        200, c.losses, 'LOSSES', '#ff6666');
    this.bigStat(PANEL_X + 140, 200, c.total,  'TOTAL',  '#ffffff');

    this.ratioBar(290, c.wins, c.losses, 0x44aa44, 0xaa4444);

    const winRate = c.total > 0 ? Math.round((c.wins / c.total) * 100) : 0;
    this.add2(this.add.text(PANEL_X, 330, `Win rate: ${winRate}%   (ongoing: ${c.ongoing})`, {
      fontSize: '15px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5));

    this.add2(this.add.text(PANEL_X, 380,
      'Counts every combat encounter logged by all players.', {
        fontSize: '12px', fontFamily: 'Arial', color: '#8899bb',
        wordWrap: { width: 440 }, align: 'center',
      }).setOrigin(0.5));
  }

  renderAnswers() {
    const p = this.stats.problems;
    this.panelTitle('ANSWERS  —  Correct vs Incorrect');

    this.bigStat(PANEL_X - 140, 200, p.correct,   'CORRECT',   '#44ff44');
    this.bigStat(PANEL_X,        200, p.incorrect, 'INCORRECT', '#ff6666');
    this.bigStat(PANEL_X + 140, 200, p.total,     'TOTAL',     '#ffffff');

    this.ratioBar(290, p.correct, p.incorrect, 0x44aa44, 0xaa4444);

    this.add2(this.add.text(PANEL_X, 330, `Accuracy: ${Math.round(p.accuracy * 100)}%`, {
      fontSize: '16px', fontFamily: 'Arial Black', color: '#88ccff',
    }).setOrigin(0.5));

    this.add2(this.add.text(PANEL_X, 380,
      'Across every math problem answered by all players.', {
        fontSize: '12px', fontFamily: 'Arial', color: '#8899bb',
        wordWrap: { width: 440 }, align: 'center',
      }).setOrigin(0.5));
  }

  renderAvgTime() {
    const ms = this.stats.avgResponseTimeMs;
    this.panelTitle('AVG TIME  —  Math Answer Speed');

    this.bigStat(PANEL_X, 220, `${(ms / 1000).toFixed(2)}s`, 'AVERAGE PER PROBLEM', '#ffcc66');

    this.add2(this.add.text(PANEL_X, 300, `${ms} ms`, {
      fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5));

    this.add2(this.add.text(PANEL_X, 360,
      'Mean response time over all answered problems\n(includes correct, incorrect, and timeouts).', {
        fontSize: '12px', fontFamily: 'Arial', color: '#8899bb',
        wordWrap: { width: 440 }, align: 'center',
      }).setOrigin(0.5));
  }

  renderEnemies() {
    const enemies = this.stats.enemies || [];
    this.panelTitle('ENEMY BALANCE  —  Apparition %');

    if (enemies.length === 0) {
      this.add2(this.add.text(PANEL_X, 280, 'No combats logged yet.', {
        fontSize: '14px', fontFamily: 'Arial', color: '#8899bb',
      }).setOrigin(0.5));
      return;
    }

    // Compact table: name | bar | percentage. Up to ~11 rows fit.
    const startY = 150;
    const rowH   = 32;
    const barX0  = PANEL_X - 60;
    const barMax = 150;
    const maxPct = Math.max(...enemies.map((e) => e.percentage), 0.0001);

    enemies.forEach((e, i) => {
      const y = startY + i * rowH;
      const typeColor = e.type === 'boss' ? '#ff6666' : e.type === 'trap' ? '#ffaa44' : '#cccccc';

      this.add2(this.add.text(PANEL_X - 230, y, e.name, {
        fontSize: '12px', fontFamily: 'Arial', color: typeColor,
      }).setOrigin(0, 0.5));

      // bar scaled to the max percentage so small values stay visible
      const w = Math.max(2, (e.percentage / maxPct) * barMax);
      this.add2(this.add.rectangle(barX0, y, barMax, 14, 0x222a40).setOrigin(0, 0.5));
      this.add2(this.add.rectangle(barX0, y, w, 14,
        e.type === 'boss' ? 0xaa4444 : e.type === 'trap' ? 0xaa8844 : 0x4477aa).setOrigin(0, 0.5));

      this.add2(this.add.text(barX0 + barMax + 10, y,
        `${(e.percentage * 100).toFixed(1)}%  (${e.appearances})`, {
          fontSize: '11px', fontFamily: 'Arial', color: '#ffffff',
        }).setOrigin(0, 0.5));
    });

    this.add2(this.add.text(PANEL_X, 540,
      'Share of all enemy encounters. Count in parentheses.', {
        fontSize: '11px', fontFamily: 'Arial', color: '#8899bb',
      }).setOrigin(0.5));
  }

  renderChests() {
    const cb = this.stats.chestBalance || {};
    this.panelTitle('CHEST BALANCE  —  Drop Rates');

    const groups = [
      { title: 'Chest type',          rows: cb.chestType   || [] },
      { title: 'Reward chest gives',  rows: cb.rewardChest || [] },
      { title: 'Trap chest triggers', rows: cb.trapChest   || [] },
    ];

    let y = 150;
    groups.forEach((g) => {
      this.add2(this.add.text(PANEL_X - 230, y, g.title, {
        fontSize: '13px', fontFamily: 'Arial Black', color: '#ffcc00',
      }).setOrigin(0, 0.5));
      y += 28;

      g.rows.forEach((r) => {
        this.add2(this.add.text(PANEL_X - 210, y, r.outcome, {
          fontSize: '12px', fontFamily: 'Arial', color: '#ffffff',
        }).setOrigin(0, 0.5));

        const barX0 = PANEL_X - 10;
        const barMax = 120;
        this.add2(this.add.rectangle(barX0, y, barMax, 14, 0x222a40).setOrigin(0, 0.5));
        this.add2(this.add.rectangle(barX0, y, r.chance * barMax, 14, 0x4477aa).setOrigin(0, 0.5));

        this.add2(this.add.text(barX0 + barMax + 10, y, `${Math.round(r.chance * 100)}%`, {
          fontSize: '12px', fontFamily: 'Arial Black', color: '#88ccff',
        }).setOrigin(0, 0.5));
        y += 26;
      });
      y += 14;
    });

    this.add2(this.add.text(PANEL_X, 545,
      'Configured design rates used by the game logic.', {
        fontSize: '11px', fontFamily: 'Arial', color: '#8899bb',
      }).setOrigin(0.5));
  }

  renderLeaderboard() {
    const players = this.players || [];
    this.panelTitle('LEADERBOARD  —  All Players');

    this.add2(this.add.text(PANEL_X, 140, 'Click a player to view their full stats', {
      fontSize: '11px', fontFamily: 'Arial', color: '#8899bb',
    }).setOrigin(0.5));

    if (players.length === 0) {
      this.add2(this.add.text(PANEL_X, 300, 'No players registered yet.', {
        fontSize: '14px', fontFamily: 'Arial', color: '#8899bb',
      }).setOrigin(0.5));
      return;
    }

    // Column headers
    const colRank = PANEL_X - 235;
    const colName = PANEL_X - 200;
    const colRuns = PANEL_X + 40;
    const colWins = PANEL_X + 120;
    const colDef  = PANEL_X + 200;
    const headerY = 168;
    this.add2(this.add.text(colRank, headerY, '#',        { fontSize: '11px', fontFamily: 'Arial Black', color: '#8899bb' }).setOrigin(0, 0.5));
    this.add2(this.add.text(colName, headerY, 'USERNAME', { fontSize: '11px', fontFamily: 'Arial Black', color: '#8899bb' }).setOrigin(0, 0.5));
    this.add2(this.add.text(colRuns, headerY, 'RUNS',     { fontSize: '11px', fontFamily: 'Arial Black', color: '#8899bb' }).setOrigin(0.5, 0.5));
    this.add2(this.add.text(colWins, headerY, 'WINS',     { fontSize: '11px', fontFamily: 'Arial Black', color: '#8899bb' }).setOrigin(0.5, 0.5));
    this.add2(this.add.text(colDef,  headerY, 'DEFEATED', { fontSize: '11px', fontFamily: 'Arial Black', color: '#8899bb' }).setOrigin(0.5, 0.5));

    // Rows (cap visible to keep within the panel; 11 fit comfortably)
    const startY = 192;
    const rowH   = 30;
    const visible = players.slice(0, 12);
    visible.forEach((p, i) => {
      const y = startY + i * rowH;

      // Clickable row background spanning the panel width
      const rowBg = this.add2(this.add.rectangle(PANEL_X, y, 470, 26, 0x1a2238, 0.6)
        .setStrokeStyle(1, 0x333355)
        .setInteractive({ useHandCursor: true }));
      rowBg.on('pointerover', () => rowBg.setFillStyle(0x2a3658, 0.9));
      rowBg.on('pointerout',  () => rowBg.setFillStyle(0x1a2238, 0.6));
      rowBg.on('pointerdown', () => {
        this.scene.start('AdminPlayerStatsScene', {
          playerID: p.playerID,
          username: p.username,
        });
      });

      this.add2(this.add.text(colRank, y, `${i + 1}`,             { fontSize: '12px', fontFamily: 'Arial', color: '#ffcc00' }).setOrigin(0, 0.5));
      this.add2(this.add.text(colName, y, p.username,             { fontSize: '12px', fontFamily: 'Arial', color: '#ffffff' }).setOrigin(0, 0.5));
      this.add2(this.add.text(colRuns, y, `${p.totalRuns}`,       { fontSize: '12px', fontFamily: 'Arial', color: '#cccccc' }).setOrigin(0.5, 0.5));
      this.add2(this.add.text(colWins, y, `${p.wins}`,            { fontSize: '12px', fontFamily: 'Arial', color: '#44ff44' }).setOrigin(0.5, 0.5));
      this.add2(this.add.text(colDef,  y, `${p.enemiesDefeated}`, { fontSize: '12px', fontFamily: 'Arial', color: '#ffaa66' }).setOrigin(0.5, 0.5));
    });

    if (players.length > visible.length) {
      this.add2(this.add.text(PANEL_X, startY + visible.length * rowH + 6,
        `+ ${players.length - visible.length} more`, {
          fontSize: '11px', fontFamily: 'Arial', color: '#8899bb',
        }).setOrigin(0.5));
    }
  }
}
