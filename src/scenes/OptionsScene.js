/**
 * OptionsScene.js
 * Settings / account screen accessible from HomeScene.
 *
 * Sections:
 *   - Account info (username, online/offline mode)
 *   - Progress controls (reset cleared levels, wipe local collection)
 *   - About (game info, credits)
 *
 * Navigation:
 *   BACK → HomeScene
 */

import Phaser from 'phaser';
import { drawConnectionBadge, drawBackButton, showConfirmDialog, showToast } from '../ui/uiHelpers.js';

export default class OptionsScene extends Phaser.Scene {
  constructor() {
    super('OptionsScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    drawConnectionBadge(this);
    drawBackButton(this, 'HomeScene');

    this.add.text(400, 50, 'OPTIONS', {
      fontSize: '32px', fontFamily: 'Arial Black', color: '#ffcc00',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    // --- Account info ---
    this.add.text(400, 105, '— ACCOUNT —', {
      fontSize: '14px', fontFamily: 'Arial Black', color: '#ffcc00',
    }).setOrigin(0.5);

    const authMode = this.registry.get('authMode');
    const username = this.registry.get('username');
    const playerID = this.registry.get('playerID');

    if (authMode === 'online' && username) {
      this.add.text(400, 135, `Username: ${username}`, {
        fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
      }).setOrigin(0.5);
      this.add.text(400, 158, `Player ID: ${playerID}`, {
        fontSize: '12px', fontFamily: 'Arial', color: '#aaaaaa',
      }).setOrigin(0.5);
      this.add.text(400, 178, 'Mode: ONLINE (progress saved)', {
        fontSize: '12px', fontFamily: 'Arial', color: '#88ffaa',
      }).setOrigin(0.5);
    } else {
      this.add.text(400, 135, 'Playing offline', {
        fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
      }).setOrigin(0.5);
      this.add.text(400, 158, 'Progress is NOT saved between sessions', {
        fontSize: '12px', fontFamily: 'Arial', color: '#ffaa44',
      }).setOrigin(0.5);
    }

    // --- Progress controls ---
    this.add.text(400, 220, '— PROGRESS —', {
      fontSize: '14px', fontFamily: 'Arial Black', color: '#ffcc00',
    }).setOrigin(0.5);

    const clearedLevels = this.registry.get('clearedLevels') || [];
    this.add.text(400, 250, `Cleared levels: ${clearedLevels.length > 0 ? clearedLevels.join(', ') : 'none'}`, {
      fontSize: '13px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);

    // Reset cleared levels (local session only — DB Run history remains for stats)
    this.makeActionButton(400, 295, 'RESET CLEARED LEVELS', 0xaa6633, () => {
      showConfirmDialog(this,
        'Reset cleared level markers? (DB stats are kept.)',
        () => {
          this.registry.set('clearedLevels', []);
          showToast(this, 'Cleared levels reset', 'success');
          this.scene.restart();
        });
    });

    // Wipe local collection (forces fresh starter deck next entry)
    this.makeActionButton(400, 345, 'WIPE LOCAL COLLECTION', 0xaa4444, () => {
      showConfirmDialog(this,
        'Discard your current local collection and deck?',
        () => {
          const player = this.registry.get('player');
          if (player) player.onDefeat();
          this.registry.set('currentMap', null);
          showToast(this, 'Collection wiped', 'success');
          this.scene.restart();
        });
    });

    // --- About ---
    this.add.text(400, 405, '— ABOUT —', {
      fontSize: '14px', fontFamily: 'Arial Black', color: '#ffcc00',
    }).setOrigin(0.5);

    this.add.text(400, 435, 'Math Smash: Card Adventure  -  v1.0', {
      fontSize: '13px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(400, 460,
      'A roguelike deck-building math game.\nTec de Monterrey — Grupo 501',
      {
        fontSize: '12px', fontFamily: 'Arial', color: '#aaaaaa',
        align: 'center',
      }).setOrigin(0.5);

    this.add.text(400, 510,
      'Team: Daniela Gil, Yuhao Liu, Mariana Ramirez',
      {
        fontSize: '11px', fontFamily: 'Arial', color: '#888899',
      }).setOrigin(0.5);
  }

  makeActionButton(x, y, label, color, onClick) {
    const bg = this.add.rectangle(x, y, 280, 36, color, 0.95)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0xffffff);
    this.add.text(x, y, label, {
      fontSize: '13px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);
    bg.on('pointerover', () => bg.setFillStyle(color, 1));
    bg.on('pointerout',  () => bg.setFillStyle(color, 0.85));
    bg.on('pointerdown', onClick);
    return bg;
  }
}
