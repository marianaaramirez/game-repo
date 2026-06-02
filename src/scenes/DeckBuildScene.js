/**
 * DeckBuildScene.js
 * Interactive deck builder shown before entering a level and after every combat.
 * The player picks which cards from their collection go into the active deck.
 *
 * Rules:
 *   - The deck holds at most 4 attack/defense cards (player.maxDeckSize).
 *   - Skill cards live in a SEPARATE slot and are auto-equipped — they do not
 *     count toward the 4-card limit.
 *   - Clicking a collection card toggles it in or out of the deck.
 *   - ENTER MAP is disabled until the deck has at least one card.
 *
 * On the first ever run this scene also creates the Player and the starter
 * collection (2 attack + 2 defense cards).
 *
 * Navigation:
 *   ENTER MAP → MapScene (passes worldLevel; the map is reused if it already exists)
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
  getDeck, addDeckCard, setDeckCardActive,
} from '../api.js';
import { drawConnectionBadge, drawBackButton, showLoading } from '../ui/uiHelpers.js';

// Display names per world level
const WORLD_NAMES = { 1: 'Ancient Temple', 2: 'Castle', 3: 'Wasteland' };

export default class DeckBuildScene extends Phaser.Scene {
  constructor() {
    super('DeckBuildScene');
  }

  /**
   * Receives worldLevel from the previous scene (LevelSelectScene or RewardScene).
   * @param {{ worldLevel: number }} data
   */
  init(data) {
    this.worldLevel = data.worldLevel || 1;
    this.autoResume = !!(data && data.autoResume);
  }

  async create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    drawConnectionBadge(this);
    drawBackButton(this, 'LevelSelectScene');

    // Create the Player on the first ever run
    let player = this.registry.get('player');
    const isNewPlayer = !player;
    if (isNewPlayer) {
      const skinIndex = this.registry.get('selectedSkin') || 0;
      player = new Player(skinIndex);
      this.registry.set('player', player);
    }

    // Hydrate from backend when the local collection is empty — covers both
    // first-time create and "resume saved run" (player exists but starts blank).
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

    // Auto-resume — if SavedGamesScene flagged a combat restore, set up the
    // enemy + map state then jump straight into CombatScene.
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
    this.add.text(400, 28, 'BUILD YOUR DECK', {
      fontSize: '26px', fontFamily: 'Arial Black', color: '#ffcc00',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(400, 56, `${WORLD_NAMES[this.worldLevel] || 'Unknown'}    -    Level ${player.level}`, {
      fontSize: '14px', fontFamily: 'Arial', color: '#88aacc',
    }).setOrigin(0.5);

    // Deck counter — green when at least one card is selected, red when empty
    const deckColor = player.deck.length > 0 ? '#44ff44' : '#ff6666';
    this.add.text(400, 84,
      `Deck: ${player.deck.length} / ${player.maxDeckSize}    (click a card to add or remove it)`, {
        fontSize: '14px', fontFamily: 'Arial Black', color: deckColor,
      }).setOrigin(0.5);

    // --- Collection grid ---
    this.renderCollection();

    // --- Skill cards section (max 1 equipped) ---
    if (player.skillCards.length > 0) {
      this.add.text(400, 372, 'SKILL CARD  (max 1 — click to equip / unequip)', {
        fontSize: '11px', fontFamily: 'Arial Black', color: '#ffaa00',
      }).setOrigin(0.5);

      this.renderSkillCards();
    }

    // Transient warning message (e.g. deck full)
    this.warnText = this.add.text(400, 530, '', {
      fontSize: '12px', fontFamily: 'Arial Black', color: '#ff6666',
    }).setOrigin(0.5);

    // --- Enter map button (disabled while the deck is empty) ---
    const canEnter = player.deck.length > 0;
    const enterBg = this.add.rectangle(400, 565, 230, 46,
      canEnter ? 0x44aa44 : 0x555555, 0.95)
      .setStrokeStyle(2, canEnter ? 0x66ff66 : 0x777777);

    this.add.text(400, 565, canEnter ? 'ENTER MAP' : 'SELECT AT LEAST 1 CARD', {
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
   * Renders every card in the collection as a clickable grid tile.
   * Cards currently in the deck are highlighted; the rest are dimmed.
   * Clicking a card toggles it and restarts the scene to redraw.
   */
  renderCollection() {
    const cards   = this.player.collection;
    const cardW   = 108;
    const cardH   = 148;
    const perRow  = 6;
    const gapX    = 8;
    const gapY    = 14;
    const startX  = 400 - ((perRow - 1) * (cardW + gapX)) / 2;
    const startY  = 188; // Y center of the first row

    cards.forEach((card, i) => {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const x   = startX + col * (cardW + gapX);
      const y   = startY + row * (cardH + gapY);

      const inDeck = this.player.isInDeck(card);

      // Selected cards are bright with a gold border; unselected are dimmed
      const bg = this.add.rectangle(x, y, cardW, cardH, card.getColor(),
        inDeck ? 0.85 : 0.32)
        .setStrokeStyle(inDeck ? 4 : 2, inDeck ? 0xffcc00 : 0x666666)
        .setInteractive({ useHandCursor: true });

      // Type badge (ATK / DEF / SKL)
      let typeLabel = 'ATK';
      if (card.type === CARD_TYPES.DEFENSE) typeLabel = 'DEF';
      if (card.type === CARD_TYPES.SKILL)   typeLabel = 'SKL';

      this.add.text(x, y - 56, typeLabel, {
        fontSize: '11px', fontFamily: 'Arial Black', color: '#ffffff',
        backgroundColor: '#00000088', padding: { x: 4, y: 2 },
      }).setOrigin(0.5);

      // "IN DECK" tag on selected cards
      if (inDeck) {
        this.add.text(x + 30, y - 56, 'IN DECK', {
          fontSize: '9px', fontFamily: 'Arial Black', color: '#1a1a2e',
          backgroundColor: '#ffcc00', padding: { x: 3, y: 1 },
        }).setOrigin(0.5);
      }

      // Card name
      this.add.text(x, y - 26, card.name, {
        fontSize: '12px', fontFamily: 'Arial Black', color: '#ffffff',
        wordWrap: { width: cardW - 10 }, align: 'center',
      }).setOrigin(0.5);

      // Power value (skill cards have baseValue 0, so it is omitted for them)
      if (card.baseValue > 0) {
        this.add.text(x, y + 6, `Power: ${card.baseValue}`, {
          fontSize: '11px', fontFamily: 'Arial', color: '#ffdd88',
        }).setOrigin(0.5);
      }

      // Card description
      this.add.text(x, y + 40, card.description, {
        fontSize: '9px', fontFamily: 'Arial', color: '#dddddd',
        wordWrap: { width: cardW - 10 }, align: 'center',
      }).setOrigin(0.5);

      // Click toggles the card in/out of the deck
      bg.on('pointerdown', () => {
        const result = this.player.toggleDeckCard(card);
        if (result === 'full') {
          this.warnText.setText(`Deck is full (max ${this.player.maxDeckSize}). Remove a card first.`);
          return;
        }
        // Sync the new is_active state to backend (fire-and-forget)
        this.syncDeckCardActive(card, result === 'added');
        // Redraw the scene to reflect the new deck selection
        this.scene.restart();
      });
    });
  }

  /**
   * Renders the player's skill cards as a horizontal clickable row.
   * Only one skill card can be equipped at a time (selectedSkill slot).
   * Equipped card is highlighted in gold; others are dimmed.
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

      this.add.text(x, y + 18, card.description, {
        fontSize: '9px', fontFamily: 'Arial', color: '#dddddd',
        wordWrap: { width: cardW - 10 }, align: 'center',
      }).setOrigin(0.5);

      bg.on('pointerdown', () => {
        const result = this.player.toggleSkillCard(card);
        this.syncSkillEquip(card, result);
        this.scene.restart();
      });
    });
  }

  // ============================================================
  // Backend sync helpers
  // ============================================================

  /**
   * Loads the player's owned skill cards from the backend and rebuilds
   * player.skillCards + player.selectedSkill on the client.
   * Skips silently in offline mode or on network failure.
   */
  async hydrateSkillDeck(player) {
    if (this.registry.get('authMode') !== 'online') return;
    const res = await getSkillDeck();
    if (!res.ok || !Array.isArray(res.data)) return;

    res.data.forEach((row) => {
      const card = getSkillByName(row.name);
      if (!card) return;
      // Tag the card so syncSkillEquip can find its DB cardID later
      card.dbCardID = row.cardID;
      player.skillCards.push(card);
      if (row.is_equipped) {
        player.selectedSkill = card;
      }
    });
  }

  /**
   * Pushes the equip/unequip change to the backend (fire-and-forget).
   * If the card lacks a dbCardID (e.g. earned offline), looks it up from the
   * catalog and POSTs to /skill-deck first so the row exists before equipping.
   */
  async syncSkillEquip(card, toggleResult) {
    if (this.registry.get('authMode') !== 'online') return;

    // Recover dbCardID from catalog if missing (covers offline→online case)
    let cardID = card.dbCardID;
    if (!cardID) {
      cardID = getCardIDByName(card.name);
      if (!cardID) return; // Catalog not loaded — give up
      card.dbCardID = cardID;
      // Ensure the row exists on backend before equipping
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
   * Each DB row becomes one card instance tagged with dbDeckCardID for sync.
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
      if (row.is_active && player.deck.length < player.maxDeckSize) {
        player.deck.push(card);
      }
    });
  }

  /**
   * Persists a freshly-added card to the backend and tags it with the
   * returned deckCardID so future toggles can sync the right row.
   */
  async persistNewCard(card, player) {
    if (this.registry.get('authMode') !== 'online') return;
    const cardID = getCardIDByName(card.name);
    if (!cardID) return;
    const isActive = player.deck.includes(card);
    const res = await addDeckCard(cardID, isActive);
    if (res.ok) {
      card.dbDeckCardID = res.data.deckCardID;
    }
  }

  /**
   * Pushes an is_active change to the backend (fire-and-forget).
   */
  syncDeckCardActive(card, isActive) {
    if (this.registry.get('authMode') !== 'online') return;
    if (!card.dbDeckCardID) return;
    setDeckCardActive(card.dbDeckCardID, isActive);
  }
}
