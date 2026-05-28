/**
 * RewardScene.js
 * Reward screen shown after winning a combat or opening a reward chest.
 *
 * Reward rules:
 *   - Boss win:   grants a skill card (separate slot), marks the level cleared,
 *                 then returns to LevelSelectScene.
 *   - Normal win: grants an attack/defense card, then goes to DeckBuildScene so
 *                 the player can reorganize the deck before continuing the map.
 *   - Chest:      60% chance of a card, 40% chance of an HP heal.
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import Phaser from 'phaser';
import CardFactory from '../cards/CardFactory.js';
import { CARD_TYPES } from '../cards/BaseCard.js';

export default class RewardScene extends Phaser.Scene {
  constructor() {
    super('RewardScene');
  }

  /**
   * @param {{ worldLevel: number, isBoss?: boolean, chestReward?: boolean }} data
   */
  init(data) {
    this.worldLevel  = data.worldLevel  || 1;
    this.isBoss      = data.isBoss      || false;
    this.chestReward = data.chestReward || false;
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const player = this.registry.get('player');

    // Title varies by reward source
    let title = 'VICTORY REWARD!';
    if (this.chestReward) title = 'CHEST REWARD!';
    if (this.isBoss)      title = 'BOSS DEFEATED!';

    this.add.text(400, 60, title, {
      fontSize: '32px', fontFamily: 'Arial Black', color: '#ffcc00',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    // --- Grant the reward ---
    let newCard;
    if (this.isBoss) {
      // Boss reward: a skill card (kept in the separate skill slot)
      newCard = CardFactory.createBossReward();
      player.addSkillCard(newCard);

      this.add.text(400, 120, 'New Skill Card Unlocked!', {
        fontSize: '20px', fontFamily: 'Arial', color: '#ffaa00',
      }).setOrigin(0.5);
    } else if (this.chestReward) {
      // Chest: either a card (60%) or an HP heal (40%)
      if (Math.random() < 0.6) {
        newCard = CardFactory.createRewardCard(this.worldLevel);
        player.addCard(newCard);
      } else {
        const healAmount = Math.round(player.maxHp * 0.25);
        player.heal(healAmount);

        this.add.text(400, 120, `Healed ${healAmount} HP!`, {
          fontSize: '20px', fontFamily: 'Arial', color: '#44ff44',
        }).setOrigin(0.5);
      }
    } else {
      // Normal combat win: an attack/defense card
      newCard = CardFactory.createRewardCard(this.worldLevel);
      player.addCard(newCard);
    }

    // --- Render the awarded card ---
    if (newCard) {
      const x = 400;
      const y = 300;
      const cardWidth  = 160;
      const cardHeight = 220;

      this.add.rectangle(x, y, cardWidth, cardHeight, newCard.getColor(), 0.8)
        .setStrokeStyle(3, 0xffcc00);

      let typeLabel = 'ATK';
      if (newCard.type === CARD_TYPES.DEFENSE) typeLabel = 'DEF';
      if (newCard.type === CARD_TYPES.SKILL)   typeLabel = 'SKL';

      this.add.text(x, y - 80, typeLabel, {
        fontSize: '14px', fontFamily: 'Arial Black', color: '#ffffff',
        backgroundColor: '#00000088', padding: { x: 6, y: 3 },
      }).setOrigin(0.5);

      this.add.text(x, y - 30, newCard.name, {
        fontSize: '18px', fontFamily: 'Arial Black', color: '#ffffff',
        wordWrap: { width: cardWidth - 15 }, align: 'center',
      }).setOrigin(0.5);

      if (newCard.baseValue > 0) {
        this.add.text(x, y + 10, `Power: ${newCard.baseValue}`, {
          fontSize: '16px', fontFamily: 'Arial', color: '#ffdd88',
        }).setOrigin(0.5);
      }

      this.add.text(x, y + 55, newCard.description, {
        fontSize: '12px', fontFamily: 'Arial', color: '#cccccc',
        wordWrap: { width: cardWidth - 15 }, align: 'center',
      }).setOrigin(0.5);
    }

    // Player status
    this.add.text(400, 450, `HP: ${player.hp}/${player.maxHp}    Level: ${player.level}`, {
      fontSize: '16px', fontFamily: 'Arial', color: '#aaaaaa',
    }).setOrigin(0.5);

    // --- Continue button ---
    const continueBg = this.add.rectangle(400, 530, 240, 50, 0x44aa44, 0.9)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x66ff66);

    // Boss → back to level select; otherwise → deck builder to reorganize
    const btnLabel = this.isBoss ? 'BACK TO LEVELS' : 'CONTINUE';
    this.add.text(400, 530, btnLabel, {
      fontSize: '18px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);

    continueBg.on('pointerdown', () => {
      if (this.isBoss) {
        // Record this level as cleared so LevelSelectScene shows the CLEARED tag
        const cleared = this.registry.get('clearedLevels') || [];
        if (!cleared.includes(this.worldLevel)) {
          cleared.push(this.worldLevel);
          this.registry.set('clearedLevels', cleared);
        }
        this.registry.set('currentMap', null);
        this.scene.start('LevelSelectScene');
      } else {
        // Reorganize the deck, then continue the current map
        this.scene.start('DeckBuildScene', { worldLevel: this.worldLevel });
      }
    });
  }
}
