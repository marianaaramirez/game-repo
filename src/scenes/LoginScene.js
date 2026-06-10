/**
 * LoginScene.js
 * Authentication screen with two modes: LOGIN and REGISTER.
 * Uses Phaser-native input boxes (rectangle + text + keyboard capture).
 * Avoids DOM elements that misalign with FIT scale mode.
 *
 * Navigation:
 *   Login OK     → HomeScene
 *   Register OK  → HomeScene
 *   Skip button  → HomeScene (offline mode, no backend tracking)
 */

import Phaser from 'phaser';
import { login, register, setToken, getToken, clearToken, getMe, bootstrapCatalog, getProfile } from '../api.js';

const MIN_PASSWORD_LEN = 6;
const INPUT_W          = 320;
const INPUT_H          = 38;

export default class LoginScene extends Phaser.Scene {
  constructor() {
    super('LoginScene');
  }

  /**
   * init() runs on every scene start (including restart).
   * Resets all form state so logout / re-entry never leaks credentials.
   * `data.mode` is passed when switching tabs via scene.restart.
   */
  init(data) {
    this.mode         = (data && data.mode) || 'login';
    this.username     = '';
    this.password     = '';
    this.focusedField = 'username';
    this.cursorVisible = true;
  }

  async create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Auto-login if a valid token already exists in localStorage
    if (getToken()) {
      const me = await getMe();
      if (me.ok) {
        // Reuse the shared post-auth flow so catalog + profile load consistently
        await this.completeAuth({
          token:    getToken(),
          playerID: me.data.playerID,
          username: me.data.username,
        });
        return;
      }
      // Token invalid/expired — purge it so we don't re-try on every refresh
      clearToken();
    }

    this.drawUI();
    this.setupKeyboard();
  }

  drawUI() {
    // Title
    this.add.text(400, 60, 'MATH SMASH', {
      fontSize: '36px', fontFamily: 'Arial Black, Arial',
      color: '#ffcc00', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    // --- Mode tabs ---
    const loginActive = this.mode === 'login';
    this.makeTab(310, 130, 'LOG IN',         loginActive  ? 0x44aa44 : 0x333344, () => this.switchMode('login'));
    this.makeTab(490, 130, 'CREATE ACCOUNT', !loginActive ? 0x4466aa : 0x333344, () => this.switchMode('register'));

    // --- Username field ---
    this.add.text(400, 185, 'Username', {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);
    this.usernameBg = this.makeInputBox(400, 220, () => this.setFocus('username'));
    this.usernameText = this.add.text(400 - INPUT_W / 2 + 10, 220, '', {
      fontSize: '17px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0, 0.5);

    // --- Password field ---
    this.add.text(400, 265, 'Password', {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);
    this.passwordBg = this.makeInputBox(400, 300, () => this.setFocus('password'));
    this.passwordText = this.add.text(400 - INPUT_W / 2 + 10, 300, '', {
      fontSize: '17px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0, 0.5);

    // Hint
    this.add.text(400, 332, this.mode === 'register' ? `Minimum ${MIN_PASSWORD_LEN} characters` : '', {
      fontSize: '11px', fontFamily: 'Arial', color: '#888899',
    }).setOrigin(0.5);

    // Status / error message
    this.statusText = this.add.text(400, 360, '', {
      fontSize: '13px', fontFamily: 'Arial', color: '#ff6666',
    }).setOrigin(0.5);

    // Action button
    const actionColor = this.mode === 'login' ? 0x44aa44 : 0x4466aa;
    const actionLabel = this.mode === 'login' ? 'LOGIN'   : 'REGISTER';
    const actionBg = this.add.rectangle(400, 410, 240, 46, actionColor, 0.95)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0xffffff);
    this.add.text(400, 410, actionLabel, {
      fontSize: '17px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);
    actionBg.on('pointerdown', () => this.handleAction());

    // Skip
    const skipBg = this.add.rectangle(400, 475, 200, 36, 0x555566, 0.8)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x888899);
    this.add.text(400, 475, 'SKIP (offline)', {
      fontSize: '13px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);
    skipBg.on('pointerdown', () => this.skipAuth());

    // Admin Login — routes to the separate administrator auth flow
    const adminBg = this.add.rectangle(400, 513, 200, 32, 0x224466, 0.9)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x66ccff);
    this.add.text(400, 513, 'ADMIN LOGIN', {
      fontSize: '13px', fontFamily: 'Arial Black', color: '#aaddff',
    }).setOrigin(0.5);
    adminBg.on('pointerover', () => adminBg.setFillStyle(0x2a5588, 1));
    adminBg.on('pointerout',  () => adminBg.setFillStyle(0x224466, 0.9));
    adminBg.on('pointerdown', () => this.scene.start('AdminLoginScene'));

    // Footer instruction
    this.add.text(400, 555, 'Click a field to focus  -  Tab to switch  -  Enter to submit', {
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
      fontSize: '15px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);
    bg.on('pointerdown', onClick);
    return bg;
  }

  makeInputBox(x, y, onClick) {
    const bg = this.add.rectangle(x, y, INPUT_W, INPUT_H, 0x222244, 1)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x4466aa);
    bg.on('pointerdown', onClick);
    return bg;
  }

  setFocus(field) {
    this.focusedField = field;
    this.refreshFocusBorders();
  }

  refreshFocusBorders() {
    const focusColor = 0xffcc00;
    const idleColor  = 0x4466aa;
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
      // Accept printable characters only (length 1, not a control key)
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
        const max = this.focusedField === 'username' ? 50 : 64;
        if (this[this.focusedField].length < max) {
          this[this.focusedField] += event.key;
          this.refreshFieldText();
        }
      }
    });

    // Cursor blink — toggles cursorVisible every 500ms, delegates to refreshFieldText
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
    // Pass mode via restart data so init() picks it up; resets username/password too
    this.scene.restart({ mode: newMode });
  }

  handleAction() {
    if (this.mode === 'login') this.handleLogin();
    else                       this.handleRegister();
  }

  /**
   * Shared post-auth setup: stores credentials, fetches catalog + profile,
   * populates registry with persistent player state, then navigates to HomeScene.
   */
  async completeAuth(authData) {
    setToken(authData.token);
    this.registry.set('playerID', authData.playerID);
    this.registry.set('username', authData.username);
    this.registry.set('authMode', 'online');

    // Load catalog and profile in parallel
    const [, profileRes] = await Promise.all([
      bootstrapCatalog(),
      getProfile(),
    ]);

    // Restore persistent player state from profile
    if (profileRes.ok) {
      this.registry.set('selectedSkin',  profileRes.data.lastSkin || 0);
      this.registry.set('clearedLevels', profileRes.data.clearedLevels || []);
    }

    this.scene.start('HomeScene');
  }

  async handleLogin() {
    if (!this.username || !this.password) {
      this.statusText.setColor('#ff6666').setText('Enter username and password');
      return;
    }
    this.statusText.setColor('#aaaaaa').setText('Logging in...');
    const res = await login(this.username, this.password);
    if (!res.ok) {
      this.statusText.setColor('#ff6666').setText(res.error || 'Login failed');
      return;
    }
    await this.completeAuth(res.data);
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
    this.statusText.setColor('#aaaaaa').setText('Creating account...');
    const res = await register(this.username, this.password);
    if (!res.ok) {
      this.statusText.setColor('#ff6666').setText(res.error || 'Register failed');
      return;
    }
    await this.completeAuth(res.data);
  }

  skipAuth() {
    this.registry.set('authMode', 'offline');
    this.scene.start('HomeScene');
  }
}

// AI tool used for code commenting: Claude (Anthropic)
