/**
 * LevelSelectScene.js
 * Level selection screen. Shows three buttons — one per level — that the player
 * can enter freely in any order.
 *
 * Each level has its own world theme and its own fixed math difficulty:
 *   Level 1 (Ancient Temple): 2-digit addition & subtraction
 *   Level 2 (Castle):         2-digit multiplication & division
 *   Level 3 (Wasteland):      mixed operations (e.g. 25 + 50 x 6)
 *
 * Cleared levels are tracked in the registry key 'clearedLevels' and shown
 * with a CLEARED tag.
 *
 * Navigation:
 *   Click a level → DeckBuildScene (passes worldLevel)
 *   BACK          → HomeScene
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import Phaser from 'phaser';
import { createRun } from '../api.js';
import { drawConnectionBadge, showLoading, showToast } from '../ui/uiHelpers.js';

// Definition of each selectable level
const LEVELS = [
  { world: 1, name: 'Ancient Temple', desc: '2-digit addition & subtraction',     color: 0x2f7d32 },
  { world: 2, name: 'Castle',         desc: '2-digit multiplication & division',  color: 0x3949ab },
  { world: 3, name: 'Wasteland',      desc: 'Mixed operations  (e.g. 25 + 50 x 6)', color: 0xb5402f },
];

export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelectScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    drawConnectionBadge(this);

    // Title
    this.add.text(400, 50, 'SELECT A LEVEL', {
      fontSize: '34px', fontFamily: 'Arial Black', color: '#ffcc00',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    // Levels already cleared (array of world numbers)
    const cleared = this.registry.get('clearedLevels') || [];

    // Player status bar (only exists after the deck builder has run once)
    const player = this.registry.get('player');
    if (player) {
      this.add.text(400, 92, `HP: ${player.hp}/${player.maxHp}    Level: ${player.level}`, {
        fontSize: '14px', fontFamily: 'Arial', color: '#aaaaaa',
      }).setOrigin(0.5);
    }

    // One button card per level
    LEVELS.forEach((lvl, i) => {
      const y = 175 + i * 108;
      const isCleared = cleared.includes(lvl.world);

      const bg = this.add.rectangle(400, y, 460, 92, lvl.color, 0.9)
        .setStrokeStyle(3, isCleared ? 0xffcc00 : 0xffffff)
        .setInteractive({ useHandCursor: true });

      this.add.text(400, y - 22, `LEVEL ${lvl.world}  -  ${lvl.name}`, {
        fontSize: '20px', fontFamily: 'Arial Black', color: '#ffffff',
      }).setOrigin(0.5);

      this.add.text(400, y + 6, lvl.desc, {
        fontSize: '13px', fontFamily: 'Arial', color: '#eeeeee',
      }).setOrigin(0.5);

      // CLEARED tag for levels whose boss was already defeated
      if (isCleared) {
        this.add.text(400, y + 30, '[ CLEARED ]', {
          fontSize: '12px', fontFamily: 'Arial Black', color: '#ffee66',
        }).setOrigin(0.5);
      }

      // Hover feedback
      bg.on('pointerover', () => bg.setStrokeStyle(4, 0xffcc00));
      bg.on('pointerout',  () => bg.setStrokeStyle(3, isCleared ? 0xffcc00 : 0xffffff));

      // Entering a level clears the stored map so a fresh one is generated.
      // Also creates a Run on the backend if the player is logged in.
      bg.on('pointerdown', async () => {
        this.registry.set('currentMap', null);
        this.registry.set('runStartTime', Date.now());
        this.registry.set('runEnemiesDefeated', 0);

        if (this.registry.get('authMode') === 'online') {
          const loader = showLoading(this, 'Starting run');
          const skin   = this.registry.get('selectedSkin') || 0;
          const res    = await createRun(lvl.world, skin);
          loader.destroy();
          if (res.ok) {
            this.registry.set('runID', res.data.runID);
          } else {
            this.registry.set('runID', null);
            showToast(this, 'Could not save run — playing offline', 'warn');
          }
        }

        this.scene.start('DeckBuildScene', { worldLevel: lvl.world });
      });
    });

    // Victory message once all three levels are cleared
    if (cleared.length >= LEVELS.length) {
      this.add.text(400, 505, 'ALL LEVELS CLEARED - You are a Math Master!', {
        fontSize: '15px', fontFamily: 'Arial Black', color: '#44ff44',
      }).setOrigin(0.5);
    }

    // Back button
    const backBg = this.add.rectangle(400, 555, 150, 40, 0xaa3333, 0.85)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0xff5555);
    this.add.text(400, 555, 'BACK', {
      fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);
    backBg.on('pointerdown', () => this.scene.start('HomeScene'));
  }
}