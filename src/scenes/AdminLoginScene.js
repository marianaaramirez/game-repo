/**
 * AdminLoginScene.js
 * Administrator authentication screen. Mirrors LoginScene (LOGIN / REGISTER
 * tabs, Phaser-native input boxes) but talks to the admin endpoints and routes
 * to AdminMenuScene on success.
 *
 * Navigation:
 *   Login OK     → AdminMenuScene
 *   Register OK  → AdminMenuScene
 *   BACK         → LoginScene
 */

import Phaser from 'phaser';
import { adminLogin, adminRegister, setAdminToken, getAdminToken, clearAdminToken, adminGetMe } from '../api.js';

const MIN_PASSWORD_LEN = 6;
const INPUT_W          = 320;
const INPUT_H          = 38;

export default class AdminLoginScene extends Phaser.Scene {
  constructor() {
    super('AdminLoginScene');
  }

  init(data) {
    this.mode          = (data && data.mode) || 'login';
    this.username      = '';
    this.password      = '';
    this.focusedField  = 'username';
    this.cursorVisible = true;
  }

  async create() {
    this.cameras.main.setBackgroundColor('#0f1424');

    // Auto-login if a valid admin token already exists
    if (getAdminToken()) {
      const me = await adminGetMe();
      if (me.ok) {
        this.registry.set('adminUsername', me.data.username);
        this.scene.start('AdminMenuScene');
        return;
      }
      clearAdminToken();
    }

    this.drawUI();
    this.setupKeyboard();
  }

  drawUI() {
    // Title
    this.add.text(400, 60, 'ADMIN PANEL', {
      fontSize: '36px', fontFamily: 'Arial Black, Arial',
      color: '#66ccff', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(400, 96, 'Administrator access', {
      fontSize: '13px', fontFamily: 'Arial', color: '#8899bb',
    }).setOrigin(0.5);

    // --- Mode tabs ---
    const loginActive = this.mode === 'login';
    this.makeTab(310, 135, 'LOG IN',         loginActive  ? 0x3377cc : 0x333344, () => this.switchMode('login'));
    this.makeTab(490, 135, 'CREATE ADMIN',   !loginActive ? 0x3377cc : 0x333344, () => this.switchMode('register'));

    // --- Username field ---
    this.add.text(400, 188, 'Admin Username', {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);
    this.usernameBg = this.makeInputBox(400, 222, () => this.setFocus('username'));
    this.usernameText = this.add.text(400 - INPUT_W / 2 + 10, 222, '', {
      fontSize: '17px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0, 0.5);

    // --- Password field ---
    this.add.text(400, 267, 'Password', {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);
    this.passwordBg = this.makeInputBox(400, 300, () => this.setFocus('password'));
    this.passwordText = this.add.text(400 - INPUT_W / 2 + 10, 300, '', {
      fontSize: '17px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0, 0.5);

    this.add.text(400, 332, this.mode === 'register' ? `Minimum ${MIN_PASSWORD_LEN} characters` : '', {
      fontSize: '11px', fontFamily: 'Arial', color: '#888899',
    }).setOrigin(0.5);

    // Status / error message
    this.statusText = this.add.text(400, 360, '', {
      fontSize: '13px', fontFamily: 'Arial', color: '#ff6666',
    }).setOrigin(0.5);

    // Action button
    const actionLabel = this.mode === 'login' ? 'LOGIN' : 'CREATE ADMIN';
    const actionBg = this.add.rectangle(400, 410, 240, 46, 0x3377cc, 0.95)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0xffffff);
    this.add.text(400, 410, actionLabel, {
      fontSize: '17px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);
    actionBg.on('pointerdown', () => this.handleAction());

    // Back to player login
    const backBg = this.add.rectangle(400, 475, 200, 36, 0x555566, 0.8)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x888899);
    this.add.text(400, 475, '< BACK TO PLAYER LOGIN', {
      fontSize: '12px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);
    backBg.on('pointerdown', () => this.scene.start('LoginScene'));

    this.add.text(400, 540, 'Click a field to focus  -  Tab to switch  -  Enter to submit', {
      fontSize: '11px', fontFamily: 'Arial', color: '#666677',
    }).setOrigin(0.5);

    this.refreshFieldText();
    this.refreshFocusBorders();
  }

  makeTab(x, y, label, color, onClick) {
    const bg = this.add.rectangle(x, y, 160, 38, color, 0.9)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0xffffff);
    this.add.text(x, y, label, {
      fontSize: '14px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);
    bg.on('pointerdown', onClick);
    return bg;
  }

  makeInputBox(x, y, onClick) {
    const bg = this.add.rectangle(x, y, INPUT_W, INPUT_H, 0x1a2238, 1)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x3377cc);
    bg.on('pointerdown', onClick);
    return bg;
  }

  setFocus(field) {
    this.focusedField = field;
    this.refreshFocusBorders();
  }

  refreshFocusBorders() {
    const focusColor = 0x66ccff;
    const idleColor  = 0x3377cc;
    this.usernameBg.setStrokeStyle(2, this.focusedField === 'username' ? focusColor : idleColor);
    this.passwordBg.setStrokeStyle(2, this.focusedField === 'password' ? focusColor : idleColor);
  }

  refreshFieldText() {
    const showCursor = this.cursorVisible !== false;
    const masked = '*'.repeat(this.password.length);
    const uCursor = (this.focusedField === 'username' && showCursor) ? '|' : '';
    const pCursor = (this.focusedField === 'password' && showCursor) ? '|' : '';
    this.usernameText.setText(this.username + uCursor);
    this.passwordText.setText(masked + pCursor);
  }

  setupKeyboard() {
    this.input.keyboard.on('keydown', (event) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        this.setFocus(this.focusedField === 'username' ? 'password' : 'username');
        this.refreshFieldText();
        return;
      }
      if (event.key === 'Enter') {
        this.handleAction();
        return;
      }
      if (event.key === 'Backspace') {
        this[this.focusedField] = this[this.focusedField].slice(0, -1);
        this.refreshFieldText();
        return;
      }
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
        const max = this.focusedField === 'username' ? 50 : 64;
        if (this[this.focusedField].length < max) {
          this[this.focusedField] += event.key;
          this.refreshFieldText();
        }
      }
    });

    this.cursorVisible = true;
    this.time.addEvent({
      delay: 500,
      loop:  true,
      callback: () => {
        this.cursorVisible = !this.cursorVisible;
        this.refreshFieldText();
      },
    });
  }

  switchMode(newMode) {
    if (this.mode === newMode) return;
    this.scene.restart({ mode: newMode });
  }

  handleAction() {
    if (this.mode === 'login') this.handleLogin();
    else                       this.handleRegister();
  }

  completeAuth(authData) {
    setAdminToken(authData.token);
    this.registry.set('adminUsername', authData.username);
    this.scene.start('AdminMenuScene');
  }

  async handleLogin() {
    if (!this.username || !this.password) {
      this.statusText.setColor('#ff6666').setText('Enter username and password');
      return;
    }
    this.statusText.setColor('#aaaaaa').setText('Logging in...');
    const res = await adminLogin(this.username, this.password);
    if (!res.ok) {
      this.statusText.setColor('#ff6666').setText(res.error || 'Login failed');
      return;
    }
    this.completeAuth(res.data);
  }

  async handleRegister() {
    if (!this.username || !this.password) {
      this.statusText.setColor('#ff6666').setText('Enter username and password');
      return;
    }
    if (this.username.length < 3) {
      this.statusText.setColor('#ff6666').setText('Username must be at least 3 characters');
      return;
    }
    if (this.password.length < MIN_PASSWORD_LEN) {
      this.statusText.setColor('#ff6666').setText(`Password must be at least ${MIN_PASSWORD_LEN} characters`);
      return;
    }
    this.statusText.setColor('#aaaaaa').setText('Creating admin...');
    const res = await adminRegister(this.username, this.password);
    if (!res.ok) {
      this.statusText.setColor('#ff6666').setText(res.error || 'Register failed');
      return;
    }
    this.completeAuth(res.data);
  }
}

// AI tool used for code commenting: Claude (Anthropic)
