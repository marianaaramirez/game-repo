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
import { getSkillDeck, equipSkillCard, unequipSkillCard, addSkillCard, getCardIDByName } from '../api.js';

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
  }

  async create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Create the Player on the first ever run
    let player = this.registry.get('player');
    if (!player) {
      const skinIndex = this.registry.get('selectedSkin') || 0;
      player = new Player(skinIndex);
      this.registry.set('player', player);
      // Restore skill deck from backend (online mode only)
      await this.hydrateSkillDeck(player);
    }

    // Build the starting collection only the first time (empty collection).
    // addCard() also auto-fills the deck, so the player starts with a full deck.
    if (player.collection.length === 0) {
      const starter = CardFactory.createStarterDeck(this.worldLevel);
      starter.forEach((c) => player.addCard(c));
    }

    this.player = player;

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
}
