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

const config = {
  type: Phaser.AUTO,
  // Internal game resolution. The canvas is rendered at this size; CSS
  // scales it to fit the window while preserving the 4:3 aspect ratio.
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',
  parent: 'game-container',
  // DOM container removed — LoginScene uses Phaser-native inputs.
  // It created a position:absolute wrapper that broke flex centering.
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    expandParent: false, // do NOT inflate the parent — keep CSS in control
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
  ],
};

const game = new Phaser.Game(config);
window.__PHASER_GAME__ = game;
