import Phaser from 'phaser';
import MapSystem from '../systems/MapSystem.js';
import EnemyFactory from '../entities/enemies/EnemyFactory.js';

const WORLD_COLORS = {
  1: { bg: '#1a2a1a', node: 0x44aa44, name: 'Ancient Temple' },
  2: { bg: '#1a1a2a', node: 0x4444aa, name: 'Castle' },
  3: { bg: '#2a1a1a', node: 0xaa4444, name: 'Wasteland' },
};

export default class MapScene extends Phaser.Scene {
  constructor() {
    super('MapScene');
  }

  init(data) {
    this.worldLevel = data.worldLevel || 1;
  }

  create() {
    const colors = WORLD_COLORS[this.worldLevel] || WORLD_COLORS[1];
    this.cameras.main.setBackgroundColor(colors.bg);

    let map = this.registry.get('currentMap');
    if (!map || map.worldLevel !== this.worldLevel) {
      map = MapSystem.generateMap(this.worldLevel);
      this.registry.set('currentMap', map);
    }

    this.add.text(400, 30, colors.name.toUpperCase(), {
      fontSize: '28px', fontFamily: 'Arial Black', color: '#ffcc00',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    const player = this.registry.get('player');
    if (player) {
      this.add.text(400, 60, `HP: ${player.hp}/${player.maxHp}  Level: ${player.level}`, {
        fontSize: '14px', fontFamily: 'Arial', color: '#aaaaaa',
      }).setOrigin(0.5);
    }

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

    map.nodes.forEach((node) => {
      let nodeColor = colors.node;
      let radius = 20;
      let label = '?';

      if (node.type === MapSystem.NODE_TYPES.BATTLE) {
        nodeColor = 0xff4444;
        label = 'B';
      } else if (node.type === MapSystem.NODE_TYPES.CHEST) {
        nodeColor = 0xffaa00;
        label = 'C';
        radius = 18;
      } else if (node.type === MapSystem.NODE_TYPES.BOSS) {
        nodeColor = 0xff0000;
        label = 'BOSS';
        radius = 28;
      }

      if (node.completed) {
        nodeColor = 0x444444;
      }

      const isAvailable = this.isNodeAvailable(map, node);

      const circle = this.add.circle(node.x, node.y, radius, nodeColor, isAvailable ? 0.9 : 0.4)
        .setStrokeStyle(isAvailable ? 3 : 1, isAvailable ? 0xffffff : 0x666666);

      this.add.text(node.x, node.y, label, {
        fontSize: node.type === MapSystem.NODE_TYPES.BOSS ? '12px' : '14px',
        fontFamily: 'Arial Black', color: '#ffffff',
      }).setOrigin(0.5);

      if (node.id === map.currentNode && !node.completed) {
        this.add.circle(node.x, node.y, radius + 5)
          .setStrokeStyle(2, 0xffcc00);
      }

      if (isAvailable && !node.completed) {
        circle.setInteractive({ useHandCursor: true });

        circle.on('pointerover', () => {
          circle.setStrokeStyle(3, 0xffcc00);
        });

        circle.on('pointerout', () => {
          circle.setStrokeStyle(3, 0xffffff);
        });

        circle.on('pointerdown', () => {
          map.currentNode = node.id;
          this.handleNodeAction(node, map);
        });
      }
    });
  }

  isNodeAvailable(map, node) {
    if (node.completed) return false;
    const currentNode = map.nodes[map.currentNode];
    if (!currentNode) return node.id === 0;
    if (currentNode.completed) {
      return currentNode.connections.includes(node.id);
    }
    return node.id === map.currentNode;
  }

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
        const enemy = EnemyFactory.createTrapEnemy();
        this.registry.set('currentEnemy', enemy);
        this.registry.set('isBoss', false);
        node.completed = true;
        this.scene.start('CombatScene', { worldLevel: this.worldLevel });
      } else {
        node.completed = true;
        this.scene.start('CombatScene', {
          worldLevel: this.worldLevel,
          trapChallenge: true,
        });
      }
    }
  }
}
