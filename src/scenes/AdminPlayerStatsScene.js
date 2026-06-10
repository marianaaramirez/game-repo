/**
 * AdminPlayerStatsScene.js
 * Admin view of a single player's stats. Renders the exact same layout the
 * player sees in StatsScene "My Stats", but fetched via the admin endpoint
 * GET /api/admin/player/:playerID/stats.
 *
 * Entered from AdminMenuScene leaderboard (click a player row).
 *
 * Navigation:
 *   BACK → AdminMenuScene (leaderboard section)
 */

import Phaser from 'phaser';
import { adminGetPlayerStats } from '../api.js';

const WORLD_NAMES = { 1: 'Ancient Temple', 2: 'Castle', 3: 'Wasteland' };

export default class AdminPlayerStatsScene extends Phaser.Scene {
  constructor() {
    super('AdminPlayerStatsScene');
  }

  init(data) {
    this.playerID = data && data.playerID;
    this.username = (data && data.username) || 'Player';
  }

  async create() {
    this.cameras.main.setBackgroundColor('#0f1424');

    this.add.text(400, 35, 'PLAYER STATS', {
      fontSize: '30px', fontFamily: 'Arial Black', color: '#66ccff',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    // Back to leaderboard
    const backBg = this.add.rectangle(80, 35, 120, 34, 0x444466, 0.9)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0xffffff);
    this.add.text(80, 35, '< LEADERBOARD', {
      fontSize: '11px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);
    backBg.on('pointerdown', () => this.scene.start('AdminMenuScene', { section: 'leaderboard' }));

    this.statusText = this.add.text(400, 320, 'Loading...', {
      fontSize: '16px', fontFamily: 'Arial', color: '#8899bb',
    }).setOrigin(0.5);

    if (!this.playerID) {
      this.statusText.setText('No player selected.').setColor('#ff6666');
      return;
    }

    const res = await adminGetPlayerStats(this.playerID);
    if (!res.ok) {
      this.statusText.setText(`Failed to load stats: ${res.error || 'unknown error'}`)
        .setColor('#ff6666');
      return;
    }
    this.statusText.setVisible(false);
    this.renderStats(res.data);
  }

  renderStats(s) {
    const username = s.username || this.username;

    // Header — player identity
    this.add.text(400, 95, username, {
      fontSize: '22px', fontFamily: 'Arial Black', color: '#ffcc00',
    }).setOrigin(0.5);

    // --- Main stat grid (3 columns × 2 rows) ---
    const stats = [
      { label: 'TOTAL RUNS',        value: s.totalRuns,                        color: '#ffffff' },
      { label: 'WINS',              value: s.wins,                              color: '#44ff44' },
      { label: 'LOSSES',            value: s.losses,                            color: '#ff6666' },
      { label: 'WIN RATE',          value: `${Math.round(s.winRate * 100)}%`,   color: '#88ccff' },
      { label: 'ENEMIES DEFEATED',  value: s.enemiesDefeated,                   color: '#ffaa66' },
      { label: 'TIME PLAYED',       value: this.formatTime(s.timePlayed),       color: '#bb88ff' },
    ];

    const startX = 130;
    const dx     = 180;
    const y      = 175;
    stats.forEach((stat, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x   = startX + col * dx;
      const yy  = y + row * 70;

      this.add.text(x, yy, String(stat.value), {
        fontSize: '24px', fontFamily: 'Arial Black', color: stat.color,
      }).setOrigin(0.5);
      this.add.text(x, yy + 24, stat.label, {
        fontSize: '11px', fontFamily: 'Arial', color: '#aaaaaa',
      }).setOrigin(0.5);
    });

    // --- Math performance ---
    this.add.text(400, 330, '— MATH PERFORMANCE —', {
      fontSize: '13px', fontFamily: 'Arial Black', color: '#ffcc00',
    }).setOrigin(0.5);

    const mathLine = `Problems: ${s.correctProblems}/${s.totalProblems} correct`
      + `   (${Math.round(s.accuracy * 100)}% accuracy)`
      + `   Avg ${(s.avgResponseTime / 1000).toFixed(1)}s`;
    this.add.text(400, 357, mathLine, {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);

    // --- Per-world breakdown ---
    this.add.text(400, 398, '— BY WORLD —', {
      fontSize: '13px', fontFamily: 'Arial Black', color: '#ffcc00',
    }).setOrigin(0.5);

    const worlds = s.byWorld || [];
    if (worlds.length === 0) {
      this.add.text(400, 435, 'No worlds played yet.', {
        fontSize: '13px', fontFamily: 'Arial', color: '#888899',
      }).setOrigin(0.5);
    } else {
      worlds.forEach((w, i) => {
        const yy   = 428 + i * 24;
        const name = WORLD_NAMES[w.world_level] || `World ${w.world_level}`;
        const acc  = w.problems > 0 ? Math.round((w.correct / w.problems) * 100) : 0;
        const line = `${name.padEnd(16)}  Runs: ${w.runs}   Wins: ${w.wins}   Enemies: ${w.enemies}   Math: ${w.correct}/${w.problems} (${acc}%)`;
        this.add.text(400, yy, line, {
          fontSize: '12px', fontFamily: 'monospace', color: '#cccccc',
        }).setOrigin(0.5);
      });
    }
  }

  formatTime(seconds) {
    const s = Number(seconds) || 0;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  }
}

// AI tool used for code commenting: Claude (Anthropic)
