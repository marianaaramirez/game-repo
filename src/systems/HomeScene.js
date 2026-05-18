import Phaser from 'phaser';

export default class HomeScene extends Phaser.Scene {
  constructor() {
    super('HomeScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const title = this.add.text(400, 120, 'MATH SMASH', {
      fontSize: '48px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffcc00',
      stroke: '#000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    const subtitle = this.add.text(400, 175, 'Card Adventure', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.createButton(400, 300, 'PLAY', () => {
      this.scene.start('CharSelectScene');
    });

    this.createButton(400, 370, 'OPTIONS', () => {
      this.scene.start('OptionsScene');
    });

    this.createButton(400, 440, 'CREDITS', () => {
      this.scene.start('CreditsScene');
    });

    this.tweens.add({
      targets: title,
      y: 130,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  createButton(x, y, label, callback) {
    const bg = this.add.rectangle(x, y, 200, 50, 0x3344aa, 0.8)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x6688ff);

    const text = this.add.text(x, y, label, {
      fontSize: '22px',
      fontFamily: 'Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    bg.on('pointerover', () => {
      bg.setFillStyle(0x5566cc, 1);
      text.setScale(1.1);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x3344aa, 0.8);
      text.setScale(1);
    });

    bg.on('pointerdown', callback);

    return { bg, text };
  }
}
