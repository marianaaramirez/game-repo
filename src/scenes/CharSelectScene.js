/**
 * CharSelectScene.js
 * Character selection screen where the player picks one of three visual skins.
 * The selected skin index is stored in the global registry and used by
 * CombatScene to render the player character with the correct color.
 *
 * Skins are visual-only — they do not affect gameplay stats.
 * All skins share the same Player class (100 HP, 10 attack).
 *
 * Navigation:
 *   Click character → saves skinIndex to registry → InstructionsScene
 *   BACK            → HomeScene
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import Phaser from 'phaser';

// Skin definitions: name, color, and short description shown below character
const SKINS = [
  { name: 'Warrior', color: 0x4488ff, desc: 'Balanced fighter' },
  { name: 'Mage', color: 0xaa44ff, desc: 'Magic specialist' },
  { name: 'Rogue', color: 0x44ff88, desc: 'Quick attacker' },
];

export default class CharSelectScene extends Phaser.Scene {
  constructor() {
    super('CharSelectScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    this.add.text(400, 60, 'CHOOSE YOUR CHARACTER', {
      fontSize: '30px',
      fontFamily: 'Arial Black',
      color: '#ffcc00',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Render each skin as a simple pixel-art-style figure (rectangle body + circle head)
    SKINS.forEach((skin, i) => {
      const x = 150 + i * 250; // Evenly spaced across the screen
      const y = 280;

      // Body rectangle
      const body = this.add.rectangle(x, y, 80, 100, skin.color, 0.9)
        .setStrokeStyle(3, 0xffffff);
      // Head circle, positioned above the body
      const head = this.add.circle(x, y - 70, 30, skin.color)
        .setStrokeStyle(3, 0xffffff);
      // Eyes (two small white circles)
      this.add.circle(x - 10, y - 75, 4, 0xffffff);
      this.add.circle(x + 10, y - 75, 4, 0xffffff);

      // Character name and description labels      
      this.add.text(x, y + 75, skin.name, {
        fontSize: '20px', fontFamily: 'Arial Black', color: '#ffffff',
      }).setOrigin(0.5);

      // Invisible hit area covering the full character sprite for click detection
      this.add.text(x, y + 100, skin.desc, {
        fontSize: '14px', fontFamily: 'Arial', color: '#aaaaaa',
      }).setOrigin(0.5);

      const hitArea = this.add.rectangle(x, y, 140, 220, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

      // Hover: highlight outline in gold
      hitArea.on('pointerover', () => {
        body.setStrokeStyle(3, 0xffcc00);
        head.setStrokeStyle(3, 0xffcc00);
      });

      // Un-hover: restore white outline
      hitArea.on('pointerout', () => {
        body.setStrokeStyle(3, 0xffffff);
        head.setStrokeStyle(3, 0xffffff);
      });
      // Click: save selection and advance to instructions
      hitArea.on('pointerdown', () => {
        this.registry.set('selectedSkin', i);
        this.scene.start('InstructionsScene');
      });
    });

    // Back button
    const backBg = this.add.rectangle(400, 530, 150, 40, 0xaa3333, 0.8)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0xff5555);
    this.add.text(400, 530, 'BACK', {
      fontSize: '18px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);
    backBg.on('pointerdown', () => this.scene.start('HomeScene'));
  }
}
