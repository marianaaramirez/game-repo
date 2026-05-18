import Phaser from 'phaser';
import Player from '../entities/Player.js';
import CardFactory from '../cards/CardFactory.js';
import { CARD_TYPES } from '../cards/BaseCard.js';

export default class DeckBuildScene extends Phaser.Scene {
  constructor() {
    super('DeckBuildScene');
  }

  init(data) {
    this.worldLevel = data.worldLevel || 1;
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    let player = this.registry.get('player');
    if (!player) {
      const skinIndex = this.registry.get('selectedSkin') || 0;
      player = new Player(skinIndex);
      this.registry.set('player', player);
    }

    if (player.deck.length === 0) {
      const starterDeck = CardFactory.createStarterDeck(this.worldLevel);
      starterDeck.forEach((c) => player.addCard(c));
    }

    this.add.text(400, 30, 'BUILD YOUR DECK', {
      fontSize: '28px', fontFamily: 'Arial Black', color: '#ffcc00',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(400, 65, `World ${this.worldLevel} - Level ${player.level}`, {
      fontSize: '16px', fontFamily: 'Arial', color: '#aaaaaa',
    }).setOrigin(0.5);

    const worldNames = { 1: 'Ancient Temple', 2: 'Castle', 3: 'Wasteland' };
    this.add.text(400, 85, worldNames[this.worldLevel] || 'Unknown', {
      fontSize: '14px', fontFamily: 'Arial', color: '#88aacc',
    }).setOrigin(0.5);

    this.add.text(400, 120, 'Your Cards:', {
      fontSize: '18px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);

    const allCards = [...player.deck, ...player.skillCards];
    const cardWidth = 110;
    const cardHeight = 150;
    const startX = 400 - ((Math.min(allCards.length, 5) - 1) * (cardWidth + 15)) / 2;

    allCards.forEach((card, i) => {
      const row = Math.floor(i / 5);
      const col = i % 5;
      const x = startX + col * (cardWidth + 15);
      const y = 230 + row * (cardHeight + 20);

      const bg = this.add.rectangle(x, y, cardWidth, cardHeight, card.getColor(), 0.7)
        .setStrokeStyle(2, 0xffffff);

      let typeLabel = 'ATK';
      if (card.type === CARD_TYPES.DEFENSE) typeLabel = 'DEF';
      if (card.type === CARD_TYPES.SKILL) typeLabel = 'SKL';

      this.add.text(x, y - 55, typeLabel, {
        fontSize: '12px', fontFamily: 'Arial Black', color: '#ffffff',
        backgroundColor: '#00000088', padding: { x: 4, y: 2 },
      }).setOrigin(0.5);

      this.add.text(x, y - 20, card.name, {
        fontSize: '12px', fontFamily: 'Arial Black', color: '#ffffff',
        wordWrap: { width: cardWidth - 10 }, align: 'center',
      }).setOrigin(0.5);

      if (card.baseValue > 0) {
        this.add.text(x, y + 15, `Power: ${card.baseValue}`, {
          fontSize: '11px', fontFamily: 'Arial', color: '#ffdd88',
        }).setOrigin(0.5);
      }

      this.add.text(x, y + 45, card.description, {
        fontSize: '9px', fontFamily: 'Arial', color: '#cccccc',
        wordWrap: { width: cardWidth - 10 }, align: 'center',
      }).setOrigin(0.5);
    });

    const startBg = this.add.rectangle(400, 550, 220, 50, 0x44aa44, 0.9)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x66ff66);
    this.add.text(400, 550, 'ENTER MAP', {
      fontSize: '20px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);

    startBg.on('pointerdown', () => {
      this.scene.start('MapScene', { worldLevel: this.worldLevel });
    });
  }
}
