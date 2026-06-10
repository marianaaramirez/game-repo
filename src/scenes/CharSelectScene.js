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
 *   Click character → saves skinIndex to registry → LevelSelectScene
 *   BACK            → HomeScene
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import Phaser from 'phaser';
import { drawConnectionBadge } from '../ui/uiHelpers.js';
import warriorImg from '../assets/Player_sprites/warrior.png';
import mageImg from '../assets/Player_sprites/mage.png';
import rogueImg from '../assets/Player_sprites/rogue.png';

// Skin definitions: name, color, and short description shown below character
const SKINS = [
  { name: 'Warrior', sprite: 'warrior', desc: '+3s on every timer' },
  { name: 'Mage', sprite: 'mage', desc: 'Easier math problems' },
  { name: 'Rogue', sprite: 'rogue', desc: 'Double effect every 2 answers' },
];

export default class CharSelectScene extends Phaser.Scene {
  constructor() {
    super('CharSelectScene');
  }

  preload() {
    this.load.image('warrior', warriorImg);
    this.load.image('mage', mageImg);
    this.load.image('rogue', rogueImg);
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    drawConnectionBadge(this);

    this.add.text(400, 60, 'CHOOSE YOUR CHARACTER', {
      fontSize: '30px',
      fontFamily: 'Arial Black',
      color: '#ffcc00',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Persistent skin choice from the player's profile (or 0 default)
    const lastSkin = this.registry.get('selectedSkin');

    // Render each skin as a simple pixel-art-style figure (rectangle body + circle head)
    SKINS.forEach((skin, i) => {
      const x = 150 + i * 250; // Evenly spaced across the screen
      const y = 280;
      const isLast = (i === lastSkin);
      const defaultBorder = isLast ? 0xffcc00 : 0xffffff;

      const character = this.add.image(x, y + 30, skin.sprite).setScale(4).setOrigin(0.5, 1);
      // "LAST USED" tag on the persisted choice
      if (isLast) {
        this.add.text(x, y - 130, 'LAST USED', {
          fontSize: '10px', fontFamily: 'Arial Black', color: '#1a1a2e',
          backgroundColor: '#ffcc00', padding: { x: 5, y: 2 },
        }).setOrigin(0.5);
      }

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
        // body.setStrokeStyle(3, 0xffcc00);
        // head.setStrokeStyle(3, 0xffcc00);
        character.setScale(4.4);
      });

      // Un-hover: restore default outline (gold if persisted, white otherwise)
      hitArea.on('pointerout', () => {
        character.setScale(4);
      });
      // Click: save selection and advance to instructions
      hitArea.on('pointerdown', () => {
        const player = this.registry.get('player');   //Actualiza skin
        if (player) {
          player.skinIndex = i;
        }
        this.registry.set('selectedSkin', i);
        this.scene.start('LevelSelectScene');
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