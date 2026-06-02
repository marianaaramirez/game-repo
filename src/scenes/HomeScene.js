/**
 * HomeScene.js
 * The main menu screen. First scene loaded when the game starts.
 * Displays the game title, an animated floating effect, and the PLAY button.
 *
 * Navigation:
 *   PLAY → CharSelectScene
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import Phaser from 'phaser';
import { clearToken } from '../api.js';
import { drawConnectionBadge, showConfirmDialog } from '../ui/uiHelpers.js';

export default class HomeScene extends Phaser.Scene {
  constructor() {
    super('HomeScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Main title — title block + button block balanced around canvas vertical center.
    // Gap above title (~140px from logout) ≈ gap below STATS (~140px from bottom edge).
    const title = this.add.text(400, 220, 'MATH SMASH', {
      fontSize: '48px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffcc00',
      stroke: '#000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    // Subtitle below the main title
    const subtitle = this.add.text(400, 275, 'Card Adventure', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Global online/offline badge (top-right corner, shared across scenes)
    drawConnectionBadge(this);

    // Account info (below the badge) — only shown in online mode
    const authMode = this.registry.get('authMode');
    const username = this.registry.get('username');
    if (authMode === 'online' && username) {
      this.add.text(790, 42, `${username}`, {
        fontSize: '12px', fontFamily: 'Arial', color: '#aaaaaa',
      }).setOrigin(1, 0);

      // Logout button (top-right, below the username)
      const logoutBg = this.add.rectangle(720, 75, 130, 30, 0xaa3333, 0.85)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, 0xff5555);
      this.add.text(720, 75, 'LOGOUT', {
        fontSize: '13px', fontFamily: 'Arial Black', color: '#ffffff',
      }).setOrigin(0.5);
      logoutBg.on('pointerover', () => logoutBg.setFillStyle(0xcc4444, 1));
      logoutBg.on('pointerout',  () => logoutBg.setFillStyle(0xaa3333, 0.85));
      logoutBg.on('pointerdown', () => this.confirmLogout());
    }

    // Main navigation — primary row (large) + secondary row (small).
    // Primary:    PLAY               LOAD GAME
    // Secondary:  INSTRUCTIONS  STATS  OPTIONS
    this.createButton(285, 360, 'PLAY',      () => this.scene.start('CharSelectScene'));
    this.createButton(515, 360, 'LOAD GAME', () => this.scene.start('SavedGamesScene'));
    this.createSmallButton(220, 450, 'INSTRUCTIONS', () => this.scene.start('InstructionsScene'));
    this.createSmallButton(400, 450, 'STATS',        () => this.scene.start('StatsScene'));
    this.createSmallButton(580, 450, 'OPTIONS',      () => this.scene.start('OptionsScene'));

    // Idle floating animation on the title — loops between y=220 and y=230
    this.tweens.add({
      targets: title,
      y: 230,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Logs the player out: clears the JWT, wipes registry state, returns to LoginScene.
   */
  /**
   * Shows a confirm modal before actually logging out. Prevents accidental clicks.
   */
  confirmLogout() {
    showConfirmDialog(this, 'Log out and clear local session?', () => {
      this.handleLogout();
    });
  }

  handleLogout() {
    clearToken();
    // Wipe ALL session-scoped registry state so the next user starts clean
    this.registry.set('playerID',           null);
    this.registry.set('username',           null);
    this.registry.set('authMode',           null);
    this.registry.set('runID',              null);
    this.registry.set('player',             null);
    this.registry.set('currentMap',         null);
    this.registry.set('runStartTime',       null);
    this.registry.set('runEnemiesDefeated', null);
    this.registry.set('clearedLevels',      []);
    this.registry.set('selectedSkin',       null);
    this.scene.start('LoginScene');
  }

  /**
   * Creates a styled interactive button with hover and click effects.
   * {number} x - Center X position
   * {number} y - Center Y position
   * {string} label - Button text
   * {function} callback - Function called on click
   * returns {{ bg: Phaser.GameObjects.Rectangle, text: Phaser.GameObjects.Text }}
   */
  createButton(x, y, label, callback) {
    const bg = this.add.rectangle(x, y, 200, 50, 0x3344aa, 0.8)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x6688ff);

    const text = this.add.text(x, y, label, {
      fontSize: '22px',
      fontFamily: 'Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Hover: brighten background and slightly scale up text
    bg.on('pointerover', () => {
      bg.setFillStyle(0x5566cc, 1);
      text.setScale(1.1);
    });

    // Un-hover: restore original appearance
    bg.on('pointerout', () => {
      bg.setFillStyle(0x3344aa, 0.8);
      text.setScale(1);
    });

    bg.on('pointerdown', callback);

    return { bg, text };
  }

  /**
   * Smaller secondary button — used for the bottom row (Instructions/Stats/Options).
   */
  createSmallButton(x, y, label, callback) {
    const bg = this.add.rectangle(x, y, 160, 40, 0x4466aa, 0.85)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x88aaff);
    const text = this.add.text(x, y, label, {
      fontSize: '14px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);
    bg.on('pointerover', () => { bg.setFillStyle(0x5577cc, 1); text.setScale(1.05); });
    bg.on('pointerout',  () => { bg.setFillStyle(0x4466aa, 0.85); text.setScale(1); });
    bg.on('pointerdown', callback);
    return { bg, text };
  }
}
