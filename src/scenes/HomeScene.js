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

export default class HomeScene extends Phaser.Scene {
  constructor() {
    super('HomeScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Main title with floating animation applied below
    const title = this.add.text(400, 120, 'MATH SMASH', {
      fontSize: '48px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffcc00',
      stroke: '#000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    // Subtitle below the main title
    const subtitle = this.add.text(400, 175, 'Card Adventure', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Account info (top-right) — only shown in online mode
    const authMode = this.registry.get('authMode');
    const username = this.registry.get('username');
    if (authMode === 'online' && username) {
      this.add.text(790, 18, `Logged in as: ${username}`, {
        fontSize: '13px', fontFamily: 'Arial', color: '#aaaaaa',
      }).setOrigin(1, 0);

      // Logout button (top-right corner)
      const logoutBg = this.add.rectangle(720, 50, 130, 30, 0xaa3333, 0.85)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, 0xff5555);
      this.add.text(720, 50, 'LOGOUT', {
        fontSize: '13px', fontFamily: 'Arial Black', color: '#ffffff',
      }).setOrigin(0.5);
      logoutBg.on('pointerover', () => logoutBg.setFillStyle(0xcc4444, 1));
      logoutBg.on('pointerout',  () => logoutBg.setFillStyle(0xaa3333, 0.85));
      logoutBg.on('pointerdown', () => this.handleLogout());
    } else if (authMode === 'offline') {
      this.add.text(790, 18, 'Offline mode', {
        fontSize: '13px', fontFamily: 'Arial', color: '#aaaaaa',
      }).setOrigin(1, 0);
    }

    // Main navigation button
    this.createButton(400, 360, 'PLAY', () => {
      this.scene.start('CharSelectScene');
    });

    // Idle floating animation on the title — loops forever with sine easing
    this.tweens.add({
      targets: title,
      y: 130,
      duration: 1500,
      yoyo: true,    // Reverses back to original position
      repeat: -1,    // Infinite loop
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Logs the player out: clears the JWT, wipes registry state, returns to LoginScene.
   */
  handleLogout() {
    clearToken();
    this.registry.set('playerID', null);
    this.registry.set('username', null);
    this.registry.set('authMode', null);
    this.registry.set('runID',    null);
    this.registry.set('player',   null);
    this.registry.set('currentMap', null);
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
}
