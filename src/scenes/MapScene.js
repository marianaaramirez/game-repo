/**
 * MapScene.js
 * Roguelike map navigation screen. Displays the procedurally generated node graph
 * for the current world and allows the player to choose their path.
 *
 * Node types displayed:
 *   B    (red circle)    — Battle encounter
 *   C    (orange circle) — Chest event (reward or trap)
 *   BOSS (large red)     — Final boss of the world
 *
 * A gold ring around a node indicates the current player position.
 * Completed nodes are grayed out and unclickable.
 * Only nodes reachable from the current position are interactive.
 *
 * Each world has distinct background and node colors defined in WORLD_COLORS.
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import Phaser from 'phaser';
import MapSystem from '../systems/MapSystem.js';
import EnemyFactory from '../entities/enemies/EnemyFactory.js';

// Visual theme per world: background color, node color, display name
const WORLD_COLORS = {
  1: { bg: '#1a2a1a', node: 0x44aa44, name: 'Ancient Temple' },
  2: { bg: '#1a1a2a', node: 0x4444aa, name: 'Castle'         },
  3: { bg: '#2a1a1a', node: 0xaa4444, name: 'Wasteland'      },
};

export default class MapScene extends Phaser.Scene {
  constructor() {
    super('MapScene');
  }

  /**
   * Receives worldLevel from the previous scene.
   * {{ worldLevel: number }} data
   */
  init(data) {
    this.worldLevel = data.worldLevel || 1;
  }

  create() {
    const colors = WORLD_COLORS[this.worldLevel] || WORLD_COLORS[1];
    this.cameras.main.setBackgroundColor(colors.bg);

    // Reuse existing map for this world, or generate a new one
    let map = this.registry.get('currentMap');
    if (!map || map.worldLevel !== this.worldLevel) {
      map = MapSystem.generateMap(this.worldLevel);
      this.registry.set('currentMap', map);
    }

    // World title
    this.add.text(400, 30, colors.name.toUpperCase(), {
      fontSize: '28px', fontFamily: 'Arial Black', color: '#ffcc00',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    // Player status bar
    const player = this.registry.get('player');
    if (player) {
      this.add.text(400, 60, `HP: ${player.hp}/${player.maxHp}  Level: ${player.level}`, {
        fontSize: '14px', fontFamily: 'Arial', color: '#aaaaaa',
      }).setOrigin(0.5);
    }

    // Draw connection lines between nodes using Phaser Graphics
    const gfx = this.add.graphics();
    map.nodes.forEach((node) => {
      node.connections.forEach((targetId) => {
        const target = map.nodes[targetId];
        if (target) {
          gfx.lineStyle(2, 0x555555, 0.6);
          gfx.beginPath();
          gfx.moveTo(node.x, node.y);
          gfx.lineTo(target.x, target.y);
          gfx.strokePath();
        }
      });
    });

    // Draw each node circle with appropriate color, label, and interactivity
    map.nodes.forEach((node) => {
      let nodeColor = colors.node;
      let radius    = 20;
      let label     = '?';

      // Assign appearance based on node type
      if (node.type === MapSystem.NODE_TYPES.BATTLE) {
        nodeColor = 0xff4444;
        label     = 'B';
      } else if (node.type === MapSystem.NODE_TYPES.CHEST) {
        nodeColor = 0xffaa00;
        label     = 'C';
        radius    = 18; // Slightly smaller than battle nodes
      } else if (node.type === MapSystem.NODE_TYPES.BOSS) {
        nodeColor = 0xff0000;
        label     = 'BOSS';
        radius    = 28; // Larger to emphasize importance
      }

      // Gray out completed nodes
      if (node.completed) {
        nodeColor = 0x444444;
      }

      const isAvailable = this.isNodeAvailable(map, node);

      // Reduce opacity for unavailable nodes
      const circle = this.add.circle(node.x, node.y, radius, nodeColor, isAvailable ? 0.9 : 0.4)
        .setStrokeStyle(isAvailable ? 3 : 1, isAvailable ? 0xffffff : 0x666666);

      this.add.text(node.x, node.y, label, {
        fontSize: node.type === MapSystem.NODE_TYPES.BOSS ? '12px' : '14px',
        fontFamily: 'Arial Black', color: '#ffffff',
      }).setOrigin(0.5);

      // Gold ring marks the current player position
      if (node.id === map.currentNode && !node.completed) {
        this.add.circle(node.x, node.y, radius + 5)
          .setStrokeStyle(2, 0xffcc00);
      }

      // Only available, incomplete nodes are interactive
      if (isAvailable && !node.completed) {
        circle.setInteractive({ useHandCursor: true });

        circle.on('pointerover', () => circle.setStrokeStyle(3, 0xffcc00));
        circle.on('pointerout',  () => circle.setStrokeStyle(3, 0xffffff));

        circle.on('pointerdown', () => {
          map.currentNode = node.id;
          this.handleNodeAction(node, map);
        });
      }
    });
  }

  /**
   * Determines whether a node can be selected by the player.
   * A node is available if it is a direct connection from the last completed node.
   * {object} map
   * {object} node
   * {boolean}
   */
  isNodeAvailable(map, node) {
    if (node.completed) return false;
    const currentNode = map.nodes[map.currentNode];
    if (!currentNode) return node.id === 0; // Starting node
    if (currentNode.completed) {
      return currentNode.connections.includes(node.id);
    }
    return node.id === map.currentNode; // Player hasn't completed this node yet
  }

  /**
   * Routes the player to the appropriate scene based on the node type.
   * {object} node
   * {object} map
   */
  handleNodeAction(node, map) {
    if (node.type === MapSystem.NODE_TYPES.BATTLE) {
      const enemy = EnemyFactory.createRandomEnemy();
      this.registry.set('currentEnemy', enemy);
      this.registry.set('isBoss', false);
      this.scene.start('CombatScene', { worldLevel: this.worldLevel });

    } else if (node.type === MapSystem.NODE_TYPES.BOSS) {
      const boss = EnemyFactory.createBoss(this.worldLevel);
      this.registry.set('currentEnemy', boss);
      this.registry.set('isBoss', true);
      this.scene.start('CombatScene', { worldLevel: this.worldLevel });

    } else if (node.type === MapSystem.NODE_TYPES.CHEST) {
      this.handleChest(node);
    }
  }

  /**
   * Handles chest node interactions.
   * REWARD chests go directly to RewardScene.
   * TRAP chests have a 50% chance of spawning a trap enemy or a math challenge.
   * {object} node
   */
  handleChest(node) {
    if (node.chestType === MapSystem.CHEST_TYPES.REWARD) {
      node.completed = true;
      this.scene.start('RewardScene', {
        worldLevel: this.worldLevel,
        chestReward: true,
        isBoss: false,
      });
    } else {
      const roll = Math.random();
      if (roll < 0.5) {
        // 50%: trap enemy encounter (CardThief or Swapper)
        const enemy = EnemyFactory.createTrapEnemy();
        this.registry.set('currentEnemy', enemy);
        this.registry.set('isBoss', false);
        node.completed = true;
        this.scene.start('CombatScene', { worldLevel: this.worldLevel });
      } else {
        // 50%: single math problem challenge (no full combat)
        node.completed = true;
        this.scene.start('CombatScene', {
          worldLevel: this.worldLevel,
          trapChallenge: true,
        });
      }
    }
  }
}
