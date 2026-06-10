/**
 * SavedGamesScene.js
 * Lists the player's saved (paused) runs. Click one to resume.
 *
 * Navigation:
 *   RESUME → MapScene (restored state)
 *   BACK   → HomeScene
 */

import Phaser from 'phaser';
import Player from '../entities/Player.js';
import MapSystem from '../systems/MapSystem.js';
import EnemyFactory from '../entities/enemies/EnemyFactory.js';
import { listSavedRuns, loadRunSave, deleteRunSave } from '../api.js';
import { drawConnectionBadge, drawBackButton, showLoading, showToast, showConfirmDialog } from '../ui/uiHelpers.js';

const WORLD_NAMES = { 1: 'Ancient Temple', 2: 'Castle', 3: 'Wasteland' };
const SKIN_NAMES  = { 0: 'Warrior', 1: 'Mage', 2: 'Rogue' };

export default class SavedGamesScene extends Phaser.Scene {
  constructor() {
    super('SavedGamesScene');
  }

  async create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    drawConnectionBadge(this);
    drawBackButton(this, 'HomeScene');

    this.add.text(400, 50, 'LOAD GAME', {
      fontSize: '32px', fontFamily: 'Arial Black', color: '#ffcc00',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    if (this.registry.get('authMode') !== 'online') {
      this.add.text(400, 300, 'Saved games require online mode.\nLog in to save and resume runs.', {
        fontSize: '16px', fontFamily: 'Arial', color: '#888899',
        align: 'center',
      }).setOrigin(0.5);
      return;
    }

    const loader = showLoading(this, 'Loading saves');
    const res    = await listSavedRuns();
    loader.destroy();

    if (!res.ok) {
      this.add.text(400, 300, `Failed to load: ${res.error}`, {
        fontSize: '14px', fontFamily: 'Arial', color: '#ff6666',
      }).setOrigin(0.5);
      return;
    }

    const runs = res.data || [];
    if (runs.length === 0) {
      this.add.text(400, 280, 'No saved games yet.', {
        fontSize: '18px', fontFamily: 'Arial Black', color: '#888899',
      }).setOrigin(0.5);
      this.add.text(400, 320,
        'Press PAUSE during combat (between math problems)\nto save your run for later.',
        {
          fontSize: '13px', fontFamily: 'Arial', color: '#666677',
          align: 'center',
        }).setOrigin(0.5);
      return;
    }

    this.add.text(400, 95, `${runs.length} save${runs.length === 1 ? '' : 's'} available`, {
      fontSize: '13px', fontFamily: 'Arial', color: '#aaaaaa',
    }).setOrigin(0.5);

    // One row per saved run — up to 5 visible
    runs.slice(0, 5).forEach((r, i) => this.drawRunRow(r, 130 + i * 85));
  }

  drawRunRow(run, y) {
    const worldName = WORLD_NAMES[run.world_level] || `World ${run.world_level}`;
    const skinName  = SKIN_NAMES[run.skin_selected] || 'Unknown';
    const savedAt   = new Date(run.saved_at).toLocaleString();

    // Card background
    this.add.rectangle(400, y, 720, 75, 0x222244, 0.9)
      .setStrokeStyle(2, 0x4466aa);

    // Left side — run summary
    this.add.text(70, y - 22, `${worldName}  -  ${skinName}`, {
      fontSize: '17px', fontFamily: 'Arial Black', color: '#ffcc00',
    }).setOrigin(0, 0.5);
    this.add.text(70, y + 4, `Enemies defeated: ${run.enemies_defeated}    -    Played: ${run.duration}s`, {
      fontSize: '12px', fontFamily: 'Arial', color: '#aaaaaa',
    }).setOrigin(0, 0.5);
    this.add.text(70, y + 22, `Saved: ${savedAt}`, {
      fontSize: '11px', fontFamily: 'Arial', color: '#888899',
    }).setOrigin(0, 0.5);

    // Right side — RESUME button
    const resumeBg = this.add.rectangle(620, y - 16, 130, 32, 0x44aa44, 0.95)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x66ff66);
    this.add.text(620, y - 16, 'RESUME', {
      fontSize: '14px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);
    resumeBg.on('pointerover', () => resumeBg.setFillStyle(0x55cc55, 1));
    resumeBg.on('pointerout',  () => resumeBg.setFillStyle(0x44aa44, 0.95));
    resumeBg.on('pointerdown', () => this.resumeRun(run));

    // DELETE button
    const delBg = this.add.rectangle(620, y + 18, 130, 28, 0xaa3333, 0.9)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0xff5555);
    this.add.text(620, y + 18, 'DELETE', {
      fontSize: '12px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);
    delBg.on('pointerdown', () => this.deleteRun(run));
  }

  async resumeRun(run) {
    const loader = showLoading(this, 'Restoring');
    const saveRes = await loadRunSave(run.runID);
    if (!saveRes.ok) {
      loader.destroy();
      showToast(this, `Load failed: ${saveRes.error}`, 'error');
      return;
    }
    const state = saveRes.data.state;

    // Restore player from snapshot
    const player = new Player(state.player.skinIndex);
    player.hp    = state.player.hp;
    player.maxHp = state.player.maxHp;
    player.level = state.player.level;
    this.registry.set('player', player);

    // Restore runtime registry values
    this.registry.set('runID',              run.runID);
    this.registry.set('selectedSkin',       state.player.skinIndex);
    this.registry.set('runEnemiesDefeated', state.enemies_defeated || 0);
    this.registry.set('runStartTime',       Date.now() - (state.duration_so_far || 0) * 1000);
    this.registry.set('currentMap',         null); // Force fresh map generation
    this.registry.set('savedMapState',      state.map || null);
    this.registry.set('resumingRun',        true);

    // If the save includes a combat snapshot, route through DeckBuildScene first
    // (to hydrate collection), then directly into CombatScene with the snapshot.
    if (state.combat) {
      // Stash the combat snapshot so a small helper scene transition can pick it up.
      this.registry.set('pendingCombatRestore', state.combat);
    }

    loader.destroy();
    // Go through DeckBuildScene so the player's collection is rehydrated from DB
    this.scene.start('DeckBuildScene', { worldLevel: state.world_level, autoResume: !!state.combat });
  }

  deleteRun(run) {
    showConfirmDialog(this, 'Delete this save permanently?', async () => {
      const res = await deleteRunSave(run.runID);
      if (res.ok) {
        showToast(this, 'Save deleted', 'success');
        this.scene.restart();
      } else {
        showToast(this, `Delete failed: ${res.error}`, 'error');
      }
    });
  }
}

// AI tool used for code commenting: Claude (Anthropic)
