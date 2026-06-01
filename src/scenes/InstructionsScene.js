/**
 * InstructionsScene.js
 * Tutorial screen shown before the player reaches the level-select screen.
 * Explains controls, the three levels and their difficulty, the combat flow,
 * and the card / deck system.
 *
 * Navigation:
 *   START ADVENTURE → LevelSelectScene
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import Phaser from 'phaser';
import { drawBackButton, drawConnectionBadge } from '../ui/uiHelpers.js';

export default class InstructionsScene extends Phaser.Scene {
  constructor() {
    super('InstructionsScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    drawConnectionBadge(this);
    drawBackButton(this, 'CharSelectScene');

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
        text: 'Mouse: select cards and navigate\nKeyboard: type math answers, Enter to confirm',
      },
      {
        title: 'Levels',
        text: 'Level 1: 2-digit addition and subtraction\nLevel 2: 2-digit multiplication and division\nLevel 3: mixed operations, e.g. 25 + 50 x 6',
      },
      {
        title: 'Combat',
        text: 'Pick a card, then solve the math problem\nAnswer fast: green 100%, yellow 75%, red 50%\nWrong answer or timeout: no effect',
      },
      {
        title: 'Cards & Deck',
        text: 'Attack: damage; some heal you or cause recoil\nDefense: block; some heal or counter\nSkill: boss abilities (separate slot)\nDeck: choose up to 4 cards, change it anytime',
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
      // Advance Y by line count x line height + spacing between sections
      yPos += section.text.split('\n').length * 20 + 15;
    });

    // Start button — goes to the level-select screen
    const playBg = this.add.rectangle(400, 550, 200, 50, 0x44aa44, 0.9)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x66ff66);
    this.add.text(400, 550, 'START ADVENTURE', {
      fontSize: '18px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);

    playBg.on('pointerdown', () => {
      this.scene.start('LevelSelectScene');
    });
  }
}
