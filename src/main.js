/**
 * main.js
 * Entry point for Math Smash: Card Adventure.
 * Configures the Phaser game instance and registers every scene.
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import Phaser from 'phaser';
import LoginScene from './scenes/LoginScene.js';
import HomeScene from './scenes/HomeScene.js';
import CharSelectScene from './scenes/CharSelectScene.js';
import InstructionsScene from './scenes/InstructionsScene.js';
import LevelSelectScene from './scenes/LevelSelectScene.js';
import DeckBuildScene from './scenes/DeckBuildScene.js';
import MapScene from './scenes/MapScene.js';
import CombatScene from './scenes/CombatScene.js';
import RewardScene from './scenes/RewardScene.js';
import StatsScene from './scenes/StatsScene.js';
import OptionsScene from './scenes/OptionsScene.js';
import SavedGamesScene from './scenes/SavedGamesScene.js';
import AdminLoginScene from './scenes/AdminLoginScene.js';
import AdminMenuScene from './scenes/AdminMenuScene.js';
import AdminPlayerStatsScene from './scenes/AdminPlayerStatsScene.js';

const config = {
  type: Phaser.AUTO,
  // Internal game resolution. The canvas is rendered at this size; CSS
  // scales it to fit the window while preserving the 4:3 aspect ratio.
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',
  parent: 'game-container',
  // High-DPI rendering — multiplies internal pixel buffer by devicePixelRatio
  // so text stays sharp on retina / 4K displays. Default 1 would render at
  // 800x600 and let the browser upscale (blurry on hi-DPI).
  resolution: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
  // roundPixels false → text positions stay sub-pixel accurate (sharper edges)
  roundPixels: false,
  antialias: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    expandParent: false,
    min: { width: 320, height: 240 },
    max: { width: 1920, height: 1440 },
  },
  // Scene order — LoginScene loads first; it routes to HomeScene after auth (or skip)
  scene: [
    LoginScene,
    HomeScene,
    CharSelectScene,
    InstructionsScene,
    LevelSelectScene,
    DeckBuildScene,
    MapScene,
    CombatScene,
    RewardScene,
    StatsScene,
    OptionsScene,
    SavedGamesScene,
    AdminLoginScene,
    AdminMenuScene,
    AdminPlayerStatsScene,
  ],
};

const game = new Phaser.Game(config);
window.__PHASER_GAME__ = game;
