/**
 * InstructionsScene.js
 * Tutorial screen shown once before the player's first run.
 * Explains all core mechanics: controls, combat flow, timer bar, card types,
 * and the win/lose progression system.
 *
 * Navigation:
 *   START ADVENTURE → DeckBuildScene (worldLevel: 1)
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import Phaser from 'phaser';

export default class InstructionsScene extends Phaser.Scene {
  constructor() {
    super('InstructionsScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    this.add.text(400, 40, 'HOW TO PLAY', {
      fontSize: '32px',
      fontFamily: 'Arial Black',
      color: '#ffcc00',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Each section has a highlighted title and descriptive body text
    const instructions = [
      {
        title: 'Controls',
        text: 'Mouse: Select cards & navigate\nKeyboard: Type math answers & confirm with Enter'
      },
      {
        title: 'Combat',
        text: '1. Select a card from your deck\n2. Solve the math problem that appears\n3. Type your answer and press Enter\n4. Card effect depends on speed & accuracy'
      },
      {
        title: 'Timer Bar',
        text: 'GREEN = 100% effect\nYELLOW = 75% effect\nRED = 50% effect\nTimeout = 0% effect'
      },
      {
        title: 'Cards',
        text: 'Attack: Deal damage to enemies\nDefense: Block incoming damage\nSkill: Special abilities (1 per deck)'
      },
      {
        title: 'Win / Lose',
        text: 'Win: Gain new card + level up\nBeat boss: Unlock skill card\nLose: Keep skill cards, lose normal deck'
      },
    ];

    // Dynamically render sections top-to-bottom, adjusting Y based on line count
    let yPos = 90;
    instructions.forEach((section) => {
      // Section title in blue
      this.add.text(80, yPos, section.title, {
        fontSize: '18px', fontFamily: 'Arial Black', color: '#88ccff',
      });
      yPos += 25;

      // Section body in light gray, with line spacing
      this.add.text(80, yPos, section.text, {
        fontSize: '14px', fontFamily: 'Arial', color: '#cccccc',
        lineSpacing: 4,
      });
      // Advance Y by line count × line height + spacing between sections
      yPos += section.text.split('\n').length * 20 + 15;
    });

    // Start button — launches world 1
    const playBg = this.add.rectangle(400, 550, 200, 50, 0x44aa44, 0.9)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x66ff66);
    this.add.text(400, 550, 'START ADVENTURE', {
      fontSize: '18px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);

    playBg.on('pointerdown', () => {
      this.scene.start('DeckBuildScene', { worldLevel: 1 });
    });
  }
}
