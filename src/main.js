/**
 * main.js
 * Entry point for Math Smash: Card Adventure.
 * Configures the Phaser game instance and registers every scene.
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import Phaser from 'phaser';
import HomeScene from './scenes/HomeScene.js';
import CharSelectScene from './scenes/CharSelectScene.js';
import InstructionsScene from './scenes/InstructionsScene.js';
import LevelSelectScene from './scenes/LevelSelectScene.js';
import DeckBuildScene from './scenes/DeckBuildScene.js';
import MapScene from './scenes/MapScene.js';
import CombatScene from './scenes/CombatScene.js';
import RewardScene from './scenes/RewardScene.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',
  parent: document.body,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // Scene order — the first entry (HomeScene) loads on startup
  scene: [
    HomeScene,
    CharSelectScene,
    InstructionsScene,
    LevelSelectScene,
    DeckBuildScene,
    MapScene,
    CombatScene,
    RewardScene,
  ],
};

const game = new Phaser.Game(config);
window.__PHASER_GAME__ = game;
