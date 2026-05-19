/**
 * HomeScene.js
 * The main menu screen. First scene loaded when the game starts.
 * Displays the game title, animated floating effect, and three navigation buttons.
 *
 * Navigation:
 *   PLAY    → CharSelectScene
 *   OPTIONS → OptionsScene
 *   CREDITS → CreditsScene
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import Phaser from 'phaser';

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

    // Main navigation buttons
    this.createButton(400, 300, 'PLAY', () => {
      this.scene.start('CharSelectScene');
    });

    this.createButton(400, 370, 'OPTIONS', () => {
      this.scene.start('OptionsScene');
    });

    this.createButton(400, 440, 'CREDITS', () => {
      this.scene.start('CreditsScene');
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
