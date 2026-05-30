/**
 * StatsScene.js
 * Displays the player's aggregated stats fetched from GET /api/stats.
 * Also has a tab to view the global leaderboard (top 10 players by wins).
 *
 * Navigation:
 *   BACK → HomeScene
 */

import Phaser from 'phaser';
import { getStats, getLeaderboard } from '../api.js';

const WORLD_NAMES = { 1: 'Ancient Temple', 2: 'Castle', 3: 'Wasteland' };

export default class StatsScene extends Phaser.Scene {
  constructor() {
    super('StatsScene');
  }

  init(data) {
    this.tab = (data && data.tab) || 'me'; // 'me' | 'leaderboard'
  }

  async create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    this.add.text(400, 35, 'STATS', {
      fontSize: '32px', fontFamily: 'Arial Black', color: '#ffcc00',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    // Tabs
    this.makeTab(280, 85, 'MY STATS',    this.tab === 'me',          () => this.switchTab('me'));
    this.makeTab(520, 85, 'LEADERBOARD', this.tab === 'leaderboard', () => this.switchTab('leaderboard'));

    // Loading text
    this.statusText = this.add.text(400, 320, 'Loading...', {
      fontSize: '16px', fontFamily: 'Arial', color: '#888899',
    }).setOrigin(0.5);

    // Back button (always visible)
    const backBg = this.add.rectangle(400, 555, 150, 40, 0xaa3333, 0.85)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0xff5555);
    this.add.text(400, 555, 'BACK', {
      fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);
    backBg.on('pointerdown', () => this.scene.start('HomeScene'));

    if (this.tab === 'me') {
      await this.renderMyStats();
    } else {
      await this.renderLeaderboard();
    }
  }

  makeTab(x, y, label, active, onClick) {
    const bg = this.add.rectangle(x, y, 200, 36, active ? 0x4466aa : 0x333344, 0.9)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0xffffff);
    this.add.text(x, y, label, {
      fontSize: '14px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);
    bg.on('pointerdown', onClick);
    return bg;
  }

  switchTab(newTab) {
    if (this.tab === newTab) return;
    this.scene.restart({ tab: newTab });
  }

  async renderMyStats() {
    const authMode = this.registry.get('authMode');
    if (authMode !== 'online') {
      this.statusText.setText('Offline mode — stats unavailable.\nLog in to see your progress.');
      return;
    }

    const res = await getStats();
    if (!res.ok) {
      this.statusText.setText(`Failed to load stats: ${res.error || 'unknown error'}`);
      return;
    }
    this.statusText.setVisible(false);

    const s = res.data;
    const username = this.registry.get('username') || 'Player';

    // Header — player identity
    this.add.text(400, 130, username, {
      fontSize: '22px', fontFamily: 'Arial Black', color: '#ffcc00',
    }).setOrigin(0.5);

    // --- Main stat grid (3 columns × 2 rows) ---
    const stats = [
      { label: 'TOTAL RUNS',        value: s.totalRuns,                          color: '#ffffff' },
      { label: 'WINS',              value: s.wins,                                color: '#44ff44' },
      { label: 'LOSSES',            value: s.losses,                              color: '#ff6666' },
      { label: 'WIN RATE',          value: `${Math.round(s.winRate * 100)}%`,    color: '#88ccff' },
      { label: 'ENEMIES DEFEATED',  value: s.enemiesDefeated,                     color: '#ffaa66' },
      { label: 'TIME PLAYED',       value: this.formatTime(s.timePlayed),         color: '#bb88ff' },
    ];

    const startX = 130;
    const dx     = 180;
    const y      = 195;
    stats.forEach((stat, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x   = startX + col * dx;
      const yy  = y + row * 70;

      this.add.text(x, yy,      String(stat.value), {
        fontSize: '24px', fontFamily: 'Arial Black', color: stat.color,
      }).setOrigin(0.5);
      this.add.text(x, yy + 24, stat.label, {
        fontSize: '11px', fontFamily: 'Arial', color: '#aaaaaa',
      }).setOrigin(0.5);
    });

    // --- Math performance ---
    this.add.text(400, 340, '— MATH PERFORMANCE —', {
      fontSize: '13px', fontFamily: 'Arial Black', color: '#ffcc00',
    }).setOrigin(0.5);

    const mathLine = `Problems: ${s.correctProblems}/${s.totalProblems} correct`
      + `   (${Math.round(s.accuracy * 100)}% accuracy)`
      + `   Avg ${(s.avgResponseTime / 1000).toFixed(1)}s`;
    this.add.text(400, 367, mathLine, {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);

    // --- Per-world breakdown ---
    this.add.text(400, 405, '— BY WORLD —', {
      fontSize: '13px', fontFamily: 'Arial Black', color: '#ffcc00',
    }).setOrigin(0.5);

    const worlds = s.byWorld || [];
    if (worlds.length === 0) {
      this.add.text(400, 440, 'No worlds played yet.', {
        fontSize: '13px', fontFamily: 'Arial', color: '#888899',
      }).setOrigin(0.5);
    } else {
      worlds.forEach((w, i) => {
        const yy   = 432 + i * 24;
        const name = WORLD_NAMES[w.world_level] || `World ${w.world_level}`;
        const acc  = w.problems > 0 ? Math.round((w.correct / w.problems) * 100) : 0;
        const line = `${name.padEnd(16)}  Runs: ${w.runs}   Wins: ${w.wins}   Enemies: ${w.enemies}   Math: ${w.correct}/${w.problems} (${acc}%)`;
        this.add.text(400, yy, line, {
          fontSize: '12px', fontFamily: 'monospace', color: '#cccccc',
        }).setOrigin(0.5);
      });
    }
  }

  async renderLeaderboard() {
    const res = await getLeaderboard();
    if (!res.ok) {
      this.statusText.setText(`Failed to load leaderboard: ${res.error || 'unknown error'}`);
      return;
    }
    this.statusText.setVisible(false);

    const rows = res.data || [];
    if (rows.length === 0) {
      this.add.text(400, 300, 'No players yet.', {
        fontSize: '16px', fontFamily: 'Arial', color: '#888899',
      }).setOrigin(0.5);
      return;
    }

    // Header
    this.add.text(400, 135, 'TOP 10 BY WINS', {
      fontSize: '16px', fontFamily: 'Arial Black', color: '#ffcc00',
    }).setOrigin(0.5);

    const headerY = 170;
    this.add.text(120, headerY, '#',         { fontSize: '13px', fontFamily: 'Arial Black', color: '#888899' });
    this.add.text(160, headerY, 'USERNAME',  { fontSize: '13px', fontFamily: 'Arial Black', color: '#888899' });
    this.add.text(400, headerY, 'RUNS',      { fontSize: '13px', fontFamily: 'Arial Black', color: '#888899' });
    this.add.text(490, headerY, 'WINS',      { fontSize: '13px', fontFamily: 'Arial Black', color: '#888899' });
    this.add.text(580, headerY, 'DEFEATED',  { fontSize: '13px', fontFamily: 'Arial Black', color: '#888899' });

    const me = this.registry.get('playerID');
    rows.forEach((r, i) => {
      const y       = 200 + i * 28;
      const isMe    = r.playerID === me;
      const color   = isMe ? '#ffcc00' : '#ffffff';
      const fontW   = isMe ? 'Arial Black' : 'Arial';
      this.add.text(120, y, `${i + 1}`,                       { fontSize: '13px', fontFamily: fontW, color });
      this.add.text(160, y, r.username + (isMe ? ' (you)' : ''),{ fontSize: '13px', fontFamily: fontW, color });
      this.add.text(400, y, `${r.totalRuns}`,                  { fontSize: '13px', fontFamily: fontW, color });
      this.add.text(490, y, `${r.wins}`,                       { fontSize: '13px', fontFamily: fontW, color });
      this.add.text(580, y, `${r.enemiesDefeated}`,            { fontSize: '13px', fontFamily: fontW, color });
    });
  }

  formatTime(seconds) {
    const s = Number(seconds) || 0;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  }
}
