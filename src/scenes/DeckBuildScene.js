/**
 * DeckBuildScene.js
 * Card ordering screen shown before entering a level and after every combat.
 * The player arranges ALL their ATK/DEF cards in order. The first 4 become
 * the initial combat hand; the rest queue up and cycle in when a card is used.
 *
 * Reordering: click a card to select it (orange glow), click another to swap.
 *
 * Skill cards occupy a separate slot (max 1 equipped). They do NOT cycle —
 * they have 2 uses per combat.
 *
 * Navigation:
 *   ENTER MAP → MapScene
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import Phaser from 'phaser';
import Player from '../entities/Player.js';
import CardFactory from '../cards/CardFactory.js';
import { CARD_TYPES } from '../cards/BaseCard.js';
import { getSkillByName } from '../cards/SkillCard.js';
import EnemyFactory from '../entities/enemies/EnemyFactory.js';
import { createAttackCardByName } from '../cards/AttackCard.js';
import { createDefenseCardByName } from '../cards/DefenseCard.js';
import {
  getSkillDeck, equipSkillCard, unequipSkillCard, addSkillCard, getCardIDByName,
  getDeck, addDeckCard,
} from '../api.js';
import { drawConnectionBadge, drawBackButton, showLoading } from '../ui/uiHelpers.js';

const WORLD_NAMES = { 1: 'Ancient Temple', 2: 'Castle', 3: 'Wasteland' };

export default class DeckBuildScene extends Phaser.Scene {
  constructor() {
    super('DeckBuildScene');
  }

  init(data) {
    this.worldLevel = data.worldLevel || 1;
    this.autoResume = !!(data && data.autoResume);
    this.selectedSwapIndex = (data && data.selectedSwapIndex !== undefined)
      ? data.selectedSwapIndex : null;
  }

  async create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    drawConnectionBadge(this);
    drawBackButton(this, 'LevelSelectScene');

    // Create the Player on the first ever run
    let player = this.registry.get('player');
    if (!player) {
      const skinIndex = this.registry.get('selectedSkin') || 0;
      player = new Player(skinIndex);
      this.registry.set('player', player);
    }

    // Hydrate from backend when the local collection is empty
    const needsHydration = player.collection.length === 0
      && player.skillCards.length === 0
      && this.registry.get('authMode') === 'online';
    if (needsHydration) {
      const loader = showLoading(this, 'Loading deck');
      await this.hydrateSkillDeck(player);
      await this.hydrateCollection(player);
      loader.destroy();
    }

    // Build the starting collection only the first time (empty collection).
    if (player.collection.length === 0) {
      const starter = CardFactory.createStarterDeck(this.worldLevel);
      const loader  = this.registry.get('authMode') === 'online'
        ? showLoading(this, 'Saving starter deck')
        : null;
      for (const card of starter) {
        player.addCard(card);
        await this.persistNewCard(card, player);
      }
      if (loader) loader.destroy();
    }

    this.player = player;

    // Auto-resume — if SavedGamesScene flagged a combat restore
    if (this.autoResume) {
      const snap = this.registry.get('pendingCombatRestore');
      if (snap) {
        this.registry.set('pendingCombatRestore', null);
        const enemy = EnemyFactory.createByName(snap.enemyName);
        if (enemy) {
          this.registry.set('currentEnemy', enemy);
          this.registry.set('isBoss', !!snap.isBoss);
          this.scene.start('CombatScene', {
            worldLevel:    this.worldLevel,
            nodeIndex:     snap.nodeIndex,
            battleNumber:  snap.battleNumber,
            combatRestore: snap,
          });
          return;
        }
      }
    }

    // --- Header ---
    this.add.text(400, 28, 'SET CARD ORDER', {
      fontSize: '26px', fontFamily: 'Arial Black', color: '#ffcc00',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(400, 56, `${WORLD_NAMES[this.worldLevel] || 'Unknown'}    -    Level ${player.level}`, {
      fontSize: '14px', fontFamily: 'Arial', color: '#88aacc',
    }).setOrigin(0.5);

    // Instructions
    const totalCards = player.deck.length;
    const handSize = Math.min(4, totalCards);
    this.add.text(400, 84,
      `${totalCards} cards — first ${handSize} in hand, rest queue up. Click two cards to swap.`, {
        fontSize: '13px', fontFamily: 'Arial', color: '#88ffaa',
      }).setOrigin(0.5);

    // --- Collection grid (ordered) ---
    this.renderCollection();

    // --- Skill cards section (unchanged) ---
    if (player.skillCards.length > 0) {
      this.add.text(400, 372, 'SKILL CARD  (max 1 — click to equip / unequip)', {
        fontSize: '11px', fontFamily: 'Arial Black', color: '#ffaa00',
      }).setOrigin(0.5);
      this.renderSkillCards();
    }

    // --- Enter map button ---
    const canEnter = player.deck.length > 0;
    const enterBg = this.add.rectangle(400, 565, 230, 46,
      canEnter ? 0x44aa44 : 0x555555, 0.95)
      .setStrokeStyle(2, canEnter ? 0x66ff66 : 0x777777);

    this.add.text(400, 565, canEnter ? 'ENTER MAP' : 'NO CARDS AVAILABLE', {
      fontSize: '17px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);

    if (canEnter) {
      enterBg.setInteractive({ useHandCursor: true });
      enterBg.on('pointerdown', () => {
        this.scene.start('MapScene', { worldLevel: this.worldLevel });
      });
    }
  }

  /**
   * Renders all ATK/DEF cards in their deck order.
   * First 4 shown as "HAND" with gold border, rest as "QUEUE" dimmed.
   * Click two cards to swap their positions.
   */
  renderCollection() {
    const cards   = this.player.deck;
    const cardW   = 108;
    const cardH   = 148;
    const perRow  = 6;
    const gapX    = 8;
    const gapY    = 14;
    const startX  = 400 - ((perRow - 1) * (cardW + gapX)) / 2;
    const startY  = 188;

    cards.forEach((card, i) => {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const x   = startX + col * (cardW + gapX);
      const y   = startY + row * (cardH + gapY);

      const inHand    = i < 4;
      const isSelected = this.selectedSwapIndex === i;

      // Visual: hand cards bright + gold, queue cards dim, selected = orange
      const borderColor = isSelected ? 0xff6600 : (inHand ? 0xffcc00 : 0x666666);
      const alpha       = isSelected ? 0.95 : (inHand ? 0.85 : 0.4);

      const bg = this.add.rectangle(x, y, cardW, cardH, card.getColor(), alpha)
        .setStrokeStyle(isSelected ? 5 : (inHand ? 4 : 2), borderColor)
        .setInteractive({ useHandCursor: true });

      // Position number
      this.add.text(x - 40, y - 60, `#${i + 1}`, {
        fontSize: '13px', fontFamily: 'Arial Black',
        color: inHand ? '#ffcc00' : '#888899',
      }).setOrigin(0.5);

      // HAND / QUEUE badge
      const badge = inHand ? 'HAND' : 'QUEUE';
      const badgeColor = inHand ? '#ffcc00' : '#888899';
      this.add.text(x + 20, y - 60, badge, {
        fontSize: '9px', fontFamily: 'Arial Black', color: '#1a1a2e',
        backgroundColor: badgeColor, padding: { x: 3, y: 1 },
      }).setOrigin(0.5);

      // Type badge
      let typeLabel = 'ATK';
      if (card.type === CARD_TYPES.DEFENSE) typeLabel = 'DEF';
      this.add.text(x, y - 40, typeLabel, {
        fontSize: '11px', fontFamily: 'Arial Black', color: '#ffffff',
        backgroundColor: '#00000088', padding: { x: 4, y: 2 },
      }).setOrigin(0.5);

      // Card name
      this.add.text(x, y - 16, card.name, {
        fontSize: '12px', fontFamily: 'Arial Black', color: '#ffffff',
        wordWrap: { width: cardW - 10 }, align: 'center',
      }).setOrigin(0.5);

      // Power value
      if (card.baseValue > 0) {
        this.add.text(x, y + 10, `Power: ${card.baseValue}`, {
          fontSize: '11px', fontFamily: 'Arial', color: '#ffdd88',
        }).setOrigin(0.5);
      }

      // Card description
      this.add.text(x, y + 40, card.description, {
        fontSize: '9px', fontFamily: 'Arial', color: '#dddddd',
        wordWrap: { width: cardW - 10 }, align: 'center',
      }).setOrigin(0.5);

      // Swap logic: click to select, click another to swap
      bg.on('pointerdown', () => {
        if (this.selectedSwapIndex === null) {
          // First click — select this card
          this.scene.restart({
            worldLevel: this.worldLevel,
            selectedSwapIndex: i,
          });
        } else if (this.selectedSwapIndex === i) {
          // Click same card — deselect
          this.scene.restart({
            worldLevel: this.worldLevel,
            selectedSwapIndex: null,
          });
        } else {
          // Second click — swap and deselect
          this.player.swapCardOrder(this.selectedSwapIndex, i);
          this.scene.restart({
            worldLevel: this.worldLevel,
            selectedSwapIndex: null,
          });
        }
      });
    });
  }

  /**
   * Renders the player's skill cards as a horizontal clickable row (unchanged).
   */
  renderSkillCards() {
    const skills  = this.player.skillCards;
    const cardW   = 108;
    const cardH   = 110;
    const gap     = 12;
    const totalW  = skills.length * (cardW + gap) - gap;
    const startX  = 400 - totalW / 2 + cardW / 2;
    const y       = 448;

    skills.forEach((card, i) => {
      const x        = startX + i * (cardW + gap);
      const equipped = this.player.selectedSkill === card;

      const bg = this.add.rectangle(x, y, cardW, cardH, 0xaa6600,
        equipped ? 0.9 : 0.3)
        .setStrokeStyle(equipped ? 4 : 2, equipped ? 0xffcc00 : 0x886600)
        .setInteractive({ useHandCursor: true });

      this.add.text(x, y - 40, 'SKL', {
        fontSize: '11px', fontFamily: 'Arial Black', color: '#ffffff',
        backgroundColor: '#00000088', padding: { x: 4, y: 2 },
      }).setOrigin(0.5);

      if (equipped) {
        this.add.text(x + 30, y - 40, 'EQUIPPED', {
          fontSize: '9px', fontFamily: 'Arial Black', color: '#1a1a2e',
          backgroundColor: '#ffcc00', padding: { x: 3, y: 1 },
        }).setOrigin(0.5);
      }

      this.add.text(x, y - 16, card.name, {
        fontSize: '11px', fontFamily: 'Arial Black', color: '#ffdd88',
        wordWrap: { width: cardW - 10 }, align: 'center',
      }).setOrigin(0.5);

      if (card.maxUsesPerLevel) {
        this.add.text(x, y + 2, `Uses: ${card.maxUsesPerLevel}/combat`, {
          fontSize: '9px', fontFamily: 'Arial', color: '#88ffaa',
        }).setOrigin(0.5);
      }

      this.add.text(x, y + 18, card.description, {
        fontSize: '9px', fontFamily: 'Arial', color: '#dddddd',
        wordWrap: { width: cardW - 10 }, align: 'center',
      }).setOrigin(0.5);

      bg.on('pointerdown', () => {
        const result = this.player.toggleSkillCard(card);
        this.syncSkillEquip(card, result);
        this.scene.restart({ worldLevel: this.worldLevel });
      });
    });
  }

  // ============================================================
  // Backend sync helpers
  // ============================================================

  async hydrateSkillDeck(player) {
    if (this.registry.get('authMode') !== 'online') return;
    const res = await getSkillDeck();
    if (!res.ok || !Array.isArray(res.data)) return;

    res.data.forEach((row) => {
      const card = getSkillByName(row.name);
      if (!card) return;
      card.dbCardID = row.cardID;
      player.skillCards.push(card);
      if (row.is_equipped) {
        player.selectedSkill = card;
      }
    });
  }

  async syncSkillEquip(card, toggleResult) {
    if (this.registry.get('authMode') !== 'online') return;
    let cardID = card.dbCardID;
    if (!cardID) {
      cardID = getCardIDByName(card.name);
      if (!cardID) return;
      card.dbCardID = cardID;
      await addSkillCard(cardID);
    }
    if (toggleResult === 'equipped') {
      equipSkillCard(cardID);
    } else if (toggleResult === 'unequipped') {
      unequipSkillCard();
    }
  }

  /**
   * Restores attack/defense card collection from backend.
   * All cards go into both collection and deck (ordered by DB insertion order).
   */
  async hydrateCollection(player) {
    if (this.registry.get('authMode') !== 'online') return;
    const res = await getDeck();
    if (!res.ok || !Array.isArray(res.data)) return;

    res.data.forEach((row) => {
      const card = row.type === 'attack'
        ? createAttackCardByName(row.name)
        : createDefenseCardByName(row.name);
      if (!card) return;
      card.dbDeckCardID = row.deckCardID;
      player.collection.push(card);
      player.deck.push(card);
    });
  }

  async persistNewCard(card, player) {
    if (this.registry.get('authMode') !== 'online') return;
    const cardID = getCardIDByName(card.name);
    if (!cardID) return;
    const res = await addDeckCard(cardID, true);
    if (res.ok) {
      card.dbDeckCardID = res.data.deckCardID;
    }
  }
}
