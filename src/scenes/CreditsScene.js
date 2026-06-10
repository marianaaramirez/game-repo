import Phaser from 'phaser';

export default class CreditsScene extends Phaser.Scene {
  constructor() {
    super('CreditsScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a1a');

    this.add.text(400, 50, 'CREDITS', {
      fontSize: '36px', fontFamily: 'Arial Black', color: '#ffcc00',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    const credits = [
      { role: 'Development Team', names: '' },
      { role: '', names: 'Daniela Janet Gil Gonzalez - A01752908' },
      { role: '', names: 'Yuhao Liu - A01787782' },
      { role: '', names: 'Mariana Ramirez Cervera - A01787819' },
      { role: '', names: '' },
      { role: 'Course', names: 'Software Construction and Decision Making' },
      { role: 'Group', names: '501' },
      { role: '', names: '' },
      { role: 'Institution', names: 'Tecnologico de Monterrey' },
      { role: '', names: '' },
      { role: 'Game Design', names: 'Math Smash: Card Adventure' },
      { role: 'Genre', names: 'RPG / Roguelike / Deck-Building' },
      { role: 'Target Audience', names: 'Ages 8-14' },
      { role: '', names: '' },
      { role: 'Graphics Style', names: 'Pixel Art' },
      { role: 'Inspiration', names: 'Plague Inc, Card Wars, Super Smash Bros, Super Mario Bros' },
    ];

    let y = 110;
    credits.forEach((entry) => {
      if (entry.role) {
        this.add.text(400, y, entry.role, {
          fontSize: '16px', fontFamily: 'Arial Black', color: '#88ccff',
        }).setOrigin(0.5);
        y += 22;
      }
      if (entry.names) {
        this.add.text(400, y, entry.names, {
          fontSize: '14px', fontFamily: 'Arial', color: '#cccccc',
        }).setOrigin(0.5);
        y += 20;
      }
      if (!entry.role && !entry.names) {
        y += 10;
      }
    });

    const backBg = this.add.rectangle(400, 555, 180, 40, 0xaa3333, 0.8)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0xff5555);
    this.add.text(400, 555, 'BACK TO MENU', {
      fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);
    backBg.on('pointerdown', () => this.scene.start('HomeScene'));
  }
}
// AI tool used for code commenting: Claude (Anthropic)
