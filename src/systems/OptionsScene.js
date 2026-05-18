import Phaser from 'phaser';

export default class OptionsScene extends Phaser.Scene {
  constructor() {
    super('OptionsScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    this.add.text(400, 60, 'OPTIONS', {
      fontSize: '36px',
      fontFamily: 'Arial Black',
      color: '#ffcc00',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(250, 160, 'Music Volume', {
      fontSize: '20px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);
    this.createSlider(450, 160, 'musicVolume', 0.7);

    this.add.text(250, 230, 'SFX Volume', {
      fontSize: '20px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);
    this.createSlider(450, 230, 'sfxVolume', 0.8);

    this.add.text(400, 320, 'Math Difficulty', {
      fontSize: '20px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);

    const difficulties = ['Addition & Subtraction', 'Multiplication & Division', 'Mixed'];
    const currentDiff = this.registry.get('mathDifficulty') || 0;

    difficulties.forEach((label, i) => {
      const isSelected = i === currentDiff;
      const bg = this.add.rectangle(400, 370 + i * 45, 300, 35,
        isSelected ? 0x44aa44 : 0x334466, 0.8)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, isSelected ? 0x66ff66 : 0x556688);

      const txt = this.add.text(400, 370 + i * 45, label, {
        fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
      }).setOrigin(0.5);

      bg.on('pointerdown', () => {
        this.registry.set('mathDifficulty', i);
        this.scene.restart();
      });
    });

    this.createBackButton();
  }

  createSlider(x, y, key, defaultVal) {
    const val = this.registry.get(key) ?? defaultVal;
    const trackW = 200;

    this.add.rectangle(x, y, trackW, 8, 0x555555).setOrigin(0.5);

    const knobX = x - trackW / 2 + val * trackW;
    const knob = this.add.circle(knobX, y, 12, 0xffcc00)
      .setInteractive({ useHandCursor: true, draggable: true });

    this.input.setDraggable(knob);

    knob.on('drag', (pointer, dragX) => {
      const minX = x - trackW / 2;
      const maxX = x + trackW / 2;
      knob.x = Phaser.Math.Clamp(dragX, minX, maxX);
      const newVal = (knob.x - minX) / trackW;
      this.registry.set(key, newVal);
    });
  }

  createBackButton() {
    const bg = this.add.rectangle(400, 550, 150, 40, 0xaa3333, 0.8)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0xff5555);

    this.add.text(400, 550, 'BACK', {
      fontSize: '18px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);

    bg.on('pointerdown', () => this.scene.start('HomeScene'));
  }
}
