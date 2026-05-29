/**
 * LoginScene.js
 * Authentication screen. Player enters username + password to log in or register.
 * Successful auth stores the JWT in localStorage and bootstraps the catalog cache.
 *
 * Inputs use HTML <input> elements overlaid on the Phaser canvas (Phaser DOM support).
 * Requires `dom: { createContainer: true }` in the Phaser game config (main.js).
 *
 * Navigation:
 *   Login OK     → HomeScene
 *   Register OK  → HomeScene
 *   Skip button  → HomeScene (offline mode, no backend tracking)
 */

import Phaser from 'phaser';
import { login, register, setToken, getToken, getMe, bootstrapCatalog } from '../api.js';

export default class LoginScene extends Phaser.Scene {
  constructor() {
    super('LoginScene');
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
      // Token invalid — fall through to the login form
    }

    // Title
    this.add.text(400, 80, 'MATH SMASH', {
      fontSize: '40px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffcc00',
      stroke: '#000',
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.add.text(400, 130, 'Sign in to track your progress', {
      fontSize: '16px', fontFamily: 'Arial', color: '#aaaaaa',
    }).setOrigin(0.5);

    // Username input (DOM overlay)
    this.add.text(400, 180, 'Username', {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);
    this.usernameInput = this.add.dom(400, 215, this.makeInput('text'));

    // Password input
    this.add.text(400, 260, 'Password', {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);
    this.passwordInput = this.add.dom(400, 295, this.makeInput('password'));

    // Status / error message
    this.statusText = this.add.text(400, 340, '', {
      fontSize: '13px', fontFamily: 'Arial', color: '#ff6666',
    }).setOrigin(0.5);

    // Buttons
    this.createButton(280, 390, 'LOGIN',    0x44aa44, () => this.handleLogin());
    this.createButton(520, 390, 'REGISTER', 0x4466aa, () => this.handleRegister());
    this.createButton(400, 460, 'SKIP (offline)', 0x666666, () => this.skipAuth());
  }

  /**
   * Creates a styled HTML <input> element for use as a DOM overlay.
   */
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

  createButton(x, y, label, color, callback) {
    const bg = this.add.rectangle(x, y, 200, 44, color, 0.9)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0xffffff);
    this.add.text(x, y, label, {
      fontSize: '16px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);
    bg.on('pointerdown', callback);
    return bg;
  }

  getCredentials() {
    const username = this.usernameInput.node.value.trim();
    const password = this.passwordInput.node.value;
    return { username, password };
  }

  async handleLogin() {
    const { username, password } = this.getCredentials();
    if (!username || !password) {
      this.statusText.setText('Enter username and password');
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
      this.statusText.setText('Enter username and password');
      return;
    }
    this.statusText.setColor('#aaaaaa').setText('Registering...');
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
