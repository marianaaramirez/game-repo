/**
 * DefeatScene.js
 * Defeat screen shown when the player's HP reaches 0 in combat.
 * Displays who defeated the player, run stats (enemies defeated, time played),
 * and two options: RETRY (return to LevelSelectScene) or MAIN MENU (HomeScene).
 *
 * Player state is reset here (HP/level) — collection is preserved.
 * Skill cards persist through defeats (roguelike rule).
 *
 * Navigation:
 *   RETRY     → LevelSelectScene
 *   MAIN MENU → HomeScene
 */

import Phaser from 'phaser';

const WORLD_NAMES = { 1: 'Ancient Temple', 2: 'Castle', 3: 'Wasteland' };

export default class DefeatScene extends Phaser.Scene {
  constructor() {
    super('DefeatScene');
  }

  /**
   * @param {{ enemyName: string, worldLevel: number }} data
   */
  init(data) {
    this.enemyName  = (data && data.enemyName)  || 'the enemy';
    this.worldLevel = (data && data.worldLevel) || 1;
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0005');

    const player      = this.registry.get('player');
    const defeated    = this.registry.get('runEnemiesDefeated') || 0;
    const startTime   = this.registry.get('runStartTime');
    const elapsed     = startTime ? Math.max(0, Math.round((Date.now() - startTime) / 1000)) : 0;
    const worldName   = WORLD_NAMES[this.worldLevel] || `World ${this.worldLevel}`;

    // --- Background dimmed rect ---
    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.6);

    // --- Title ---
    this.add.text(400, 90, 'DEFEAT', {
      fontSize: '56px', fontFamily: 'Arial Black',
      color: '#ff3333', stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5);

    // --- Subtitle ---
    this.add.text(400, 158, `Defeated by ${this.enemyName}`, {
      fontSize: '20px', fontFamily: 'Arial', color: '#ffaaaa',
    }).setOrigin(0.5);

    // --- Divider ---
    this.add.rectangle(400, 195, 420, 2, 0x553333);

    // --- Run summary ---
    this.add.text(400, 230, `World: ${worldName}`, {
      fontSize: '16px', fontFamily: 'Arial', color: '#cccccc',
    }).setOrigin(0.5);

    this.add.text(400, 262, `Enemies defeated this run: ${defeated}`, {
      fontSize: '16px', fontFamily: 'Arial', color: '#ffaa66',
    }).setOrigin(0.5);

    this.add.text(400, 294, `Time played: ${this.formatTime(elapsed)}`, {
      fontSize: '16px', fontFamily: 'Arial', color: '#aaaacc',
    }).setOrigin(0.5);

    if (player) {
      this.add.text(400, 326, `Level reached: ${player.level}`, {
        fontSize: '16px', fontFamily: 'Arial', color: '#88ccff',
      }).setOrigin(0.5);

      // Skill cards info (they persist — good news)
      if (player.skillCards.length > 0) {
        const skillNames = player.skillCards.map((c) => c.name).join(', ');
        this.add.text(400, 358, `Skill cards kept: ${skillNames}`, {
          fontSize: '13px', fontFamily: 'Arial', color: '#ffcc44',
          wordWrap: { width: 500 }, align: 'center',
        }).setOrigin(0.5);
      }
    }

    // --- Divider ---
    this.add.rectangle(400, 400, 420, 2, 0x553333);

    // --- Message ---
    this.add.text(400, 430, 'Your collection is preserved. Try again!', {
      fontSize: '14px', fontFamily: 'Arial', color: '#999999',
      fontStyle: 'italic',
    }).setOrigin(0.5);

    // --- Buttons ---
    this.makeButton(290, 490, 'RETRY', 0xaa3333, 0xff5555, () => {
      this.scene.start('LevelSelectScene');
    });

    this.makeButton(510, 490, 'MAIN MENU', 0x333355, 0x6666aa, () => {
      this.scene.start('HomeScene');
    });
  }

  makeButton(x, y, label, color, borderColor, onClick) {
    const bg = this.add.rectangle(x, y, 190, 48, color, 0.95)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, borderColor);
    this.add.text(x, y, label, {
      fontSize: '18px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);
    bg.on('pointerover', () => bg.setFillStyle(color, 1).setStrokeStyle(3, borderColor));
    bg.on('pointerout',  () => bg.setFillStyle(color, 0.95).setStrokeStyle(2, borderColor));
    bg.on('pointerdown', onClick);
    return bg;
  }

  formatTime(seconds) {
    const m   = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${m}m ${sec}s`;
  }
}

// AI tool used for code commenting: Claude (Anthropic)
