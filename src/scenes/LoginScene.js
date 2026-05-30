/**
 * LoginScene.js
 * Authentication screen with two modes: LOGIN and REGISTER.
 * Player can switch modes via the tabs at the top.
 * Successful auth stores the JWT in localStorage and bootstraps the catalog cache.
 *
 * Inputs use HTML <input> elements overlaid on the Phaser canvas.
 * Requires `dom: { createContainer: true }` in the Phaser game config.
 *
 * Navigation:
 *   Login OK     → HomeScene
 *   Register OK  → HomeScene
 *   Skip button  → HomeScene (offline mode, no backend tracking)
 */

import Phaser from 'phaser';
import { login, register, setToken, getToken, getMe, bootstrapCatalog } from '../api.js';

const MIN_PASSWORD_LEN = 6;

export default class LoginScene extends Phaser.Scene {
  constructor() {
    super('LoginScene');
    this.mode = 'login'; // 'login' | 'register'
  }

  async create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Auto-login if a valid token already exists in localStorage
    if (getToken()) {
      const me = await getMe();
      if (me.ok) {
        this.registry.set('playerID',  me.data.playerID);
        this.registry.set('username',  me.data.username);
        this.registry.set('authMode',  'online');
        await bootstrapCatalog();
        this.scene.start('HomeScene');
        return;
      }
    }

    this.drawUI();
  }

  drawUI() {
    // Title
    this.add.text(400, 60, 'MATH SMASH', {
      fontSize: '36px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffcc00',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Mode tabs
    this.loginTabBg    = this.add.rectangle(310, 130, 160, 38, this.mode === 'login'    ? 0x44aa44 : 0x333344, 0.9)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0xffffff);
    this.add.text(310, 130, 'LOG IN', {
      fontSize: '15px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);
    this.loginTabBg.on('pointerdown', () => this.switchMode('login'));

    this.registerTabBg = this.add.rectangle(490, 130, 160, 38, this.mode === 'register' ? 0x4466aa : 0x333344, 0.9)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0xffffff);
    this.add.text(490, 130, 'CREATE ACCOUNT', {
      fontSize: '15px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);
    this.registerTabBg.on('pointerdown', () => this.switchMode('register'));

    // Username field
    this.add.text(400, 185, 'Username', {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);
    this.usernameInput = this.add.dom(400, 220, this.makeInput('text'));

    // Password field
    this.add.text(400, 265, 'Password', {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);
    this.passwordInput = this.add.dom(400, 300, this.makeInput('password'));

    // Password hint (only in register mode)
    this.hintText = this.add.text(400, 332, this.mode === 'register' ? `Minimum ${MIN_PASSWORD_LEN} characters` : '', {
      fontSize: '11px', fontFamily: 'Arial', color: '#888899',
    }).setOrigin(0.5);

    // Status / error message
    this.statusText = this.add.text(400, 360, '', {
      fontSize: '13px', fontFamily: 'Arial', color: '#ff6666',
    }).setOrigin(0.5);

    // Action button (label depends on mode)
    this.actionBg = this.add.rectangle(400, 410, 240, 46, this.mode === 'login' ? 0x44aa44 : 0x4466aa, 0.95)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0xffffff);
    this.actionLabel = this.add.text(400, 410, this.mode === 'login' ? 'LOGIN' : 'REGISTER', {
      fontSize: '17px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);
    this.actionBg.on('pointerdown', () => this.handleAction());

    // Skip (offline mode)
    const skipBg = this.add.rectangle(400, 475, 200, 36, 0x555566, 0.8)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x888899);
    this.add.text(400, 475, 'SKIP (offline)', {
      fontSize: '13px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);
    skipBg.on('pointerdown', () => this.skipAuth());
  }

  switchMode(newMode) {
    if (this.mode === newMode) return;
    this.mode = newMode;
    // Easiest way to re-render the toggle state — restart the scene
    this.scene.restart();
  }

  makeInput(type) {
    const input = document.createElement('input');
    input.type = type;
    input.style.width            = '260px';
    input.style.height           = '34px';
    input.style.padding          = '0 10px';
    input.style.fontSize         = '16px';
    input.style.border           = '2px solid #4466aa';
    input.style.borderRadius     = '4px';
    input.style.backgroundColor  = '#222244';
    input.style.color            = '#ffffff';
    input.style.outline          = 'none';
    return input;
  }

  getCredentials() {
    const username = this.usernameInput.node.value.trim();
    const password = this.passwordInput.node.value;
    return { username, password };
  }

  handleAction() {
    if (this.mode === 'login') this.handleLogin();
    else                       this.handleRegister();
  }

  async handleLogin() {
    const { username, password } = this.getCredentials();
    if (!username || !password) {
      this.statusText.setColor('#ff6666').setText('Enter username and password');
      return;
    }
    this.statusText.setColor('#aaaaaa').setText('Logging in...');
    const res = await login(username, password);
    if (!res.ok) {
      this.statusText.setColor('#ff6666').setText(res.error || 'Login failed');
      return;
    }
    setToken(res.data.token);
    this.registry.set('playerID',  res.data.playerID);
    this.registry.set('username',  res.data.username);
    this.registry.set('authMode',  'online');
    await bootstrapCatalog();
    this.scene.start('HomeScene');
  }

  async handleRegister() {
    const { username, password } = this.getCredentials();
    if (!username || !password) {
      this.statusText.setColor('#ff6666').setText('Enter username and password');
      return;
    }
    if (username.length < 3) {
      this.statusText.setColor('#ff6666').setText('Username must be at least 3 characters');
      return;
    }
    if (password.length < MIN_PASSWORD_LEN) {
      this.statusText.setColor('#ff6666').setText(`Password must be at least ${MIN_PASSWORD_LEN} characters`);
      return;
    }
    this.statusText.setColor('#aaaaaa').setText('Creating account...');
    const res = await register(username, password);
    if (!res.ok) {
      this.statusText.setColor('#ff6666').setText(res.error || 'Register failed');
      return;
    }
    setToken(res.data.token);
    this.registry.set('playerID',  res.data.playerID);
    this.registry.set('username',  res.data.username);
    this.registry.set('authMode',  'online');
    await bootstrapCatalog();
    this.scene.start('HomeScene');
  }

  skipAuth() {
    this.registry.set('authMode', 'offline');
    this.scene.start('HomeScene');
  }
}
