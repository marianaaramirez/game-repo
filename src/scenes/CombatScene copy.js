import Phaser from 'phaser';
import MathSystem from '../systems/MathSystem.js';
import TimerSystem from '../systems/TimerSystem.js';
import CombatSystem from '../systems/CombatSystem.js';
import { CARD_TYPES } from '../cards/BaseCard.js';

export default class CombatScene extends Phaser.Scene {
  constructor() {
    super('CombatScene');
  }

  init(data) {
    this.worldLevel = data.worldLevel || 1;
    this.trapChallenge = data.trapChallenge || false;
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a1a');

    this.player = this.registry.get('player');
    this.enemy = this.registry.get('currentEnemy');
    this.isBoss = this.registry.get('isBoss') || false;

    this.combatState = CombatSystem.COMBAT_STATE.SELECT_CARD;
    this.currentProblem = null;
    this.timerStartTime = 0;
    this.selectedCard = null;
    this.activeDefense = 0;
    this.inputText = '';
    this.combatContext = {
      cardEffectivenessModifier: 1,
      enemyDamageReduction: 0,
      disabledCardIndex: -1,
      lockedCardIndex: -1,
      enemyStrikesFirst: false,
      enemyDoubleAction: false,
      enemyDamageBoost: 1,
      timerReduction: 0,
      enemySkipAttack: false,
      swapRandomCard: false,
      playerDeck: this.player.getActiveDeck(),
    };

    this.drawBattleUI();
    this.drawCards();
    this.setupKeyboardInput();

    if (this.trapChallenge) {
      this.startTrapChallenge();
    }
  }

  drawBattleUI() {
    // Player side
    this.add.text(120, 30, this.player.name, {
      fontSize: '18px', fontFamily: 'Arial Black', color: '#44aaff',
    }).setOrigin(0.5);

    const skinColors = [0x4488ff, 0xaa44ff, 0x44ff88];
    const skinColor = skinColors[this.player.skinIndex] || 0x4488ff;
    this.add.rectangle(120, 130, 60, 80, skinColor, 0.9).setStrokeStyle(2, 0xffffff);
    this.add.circle(120, 75, 25, skinColor).setStrokeStyle(2, 0xffffff);
    this.add.circle(113, 70, 3, 0xffffff);
    this.add.circle(127, 70, 3, 0xffffff);

    this.playerHpBar = this.add.rectangle(120, 190, 140, 16, 0x333333).setStrokeStyle(1, 0x666666);
    this.playerHpFill = this.add.rectangle(
      120 - 70 + (this.player.getHpRatio() * 140) / 2,
      190,
      this.player.getHpRatio() * 140,
      14,
      0x44ff44
    ).setOrigin(0.5);

    this.playerHpText = this.add.text(120, 190, `${this.player.hp}/${this.player.maxHp}`, {
      fontSize: '11px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);

    // Enemy side
    this.add.text(650, 30, this.enemy.name, {
      fontSize: '18px', fontFamily: 'Arial Black',
      color: this.isBoss ? '#ff4444' : '#ff8844',
    }).setOrigin(0.5);

    const enemySize = this.isBoss ? 50 : 35;
    this.add.rectangle(650, 120, enemySize * 1.5, enemySize * 2, this.enemy.color, 0.9)
      .setStrokeStyle(2, 0xff4444);

    if (this.isBoss) {
      this.add.text(650, 60, 'BOSS', {
        fontSize: '12px', fontFamily: 'Arial Black', color: '#ff0000',
        backgroundColor: '#000000aa', padding: { x: 6, y: 2 },
      }).setOrigin(0.5);
    }

    this.enemyHpBar = this.add.rectangle(650, 190, 140, 16, 0x333333).setStrokeStyle(1, 0x666666);
    this.enemyHpFill = this.add.rectangle(
      650 - 70 + (this.enemy.getHpRatio() * 140) / 2,
      190,
      this.enemy.getHpRatio() * 140,
      14,
      0xff4444
    ).setOrigin(0.5);

    this.enemyHpText = this.add.text(650, 190, `${this.enemy.hp}/${this.enemy.maxHp}`, {
      fontSize: '11px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);

    // Timer bar
    this.add.text(400, 225, 'TIMER', {
      fontSize: '12px', fontFamily: 'Arial', color: '#888888',
    }).setOrigin(0.5);
    this.timerBarBg = this.add.rectangle(400, 245, 500, 20, 0x333333).setStrokeStyle(1, 0x666666);
    this.timerBarFill = this.add.rectangle(150, 245, 500, 18, 0x00ff00).setOrigin(0, 0.5);
    this.timerBarFill.setVisible(false);

    // Math problem area
    this.problemText = this.add.text(400, 290, 'Select a card to begin', {
      fontSize: '24px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);

    // Answer input
    this.inputBg = this.add.rectangle(400, 340, 200, 40, 0x222244, 0.9)
      .setStrokeStyle(2, 0x4466aa).setVisible(false);
    this.inputDisplay = this.add.text(400, 340, '', {
      fontSize: '24px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5).setVisible(false);

    // Message area
    this.messageText = this.add.text(400, 385, '', {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffcc00',
      wordWrap: { width: 600 }, align: 'center',
    }).setOrigin(0.5);
  }

  drawCards() {
    this.cardObjects = [];
    const deck = this.combatContext.playerDeck;
    const cardWidth = 100;
    const startX = 400 - ((deck.length - 1) * (cardWidth + 10)) / 2;

    deck.forEach((card, i) => {
      const x = startX + i * (cardWidth + 10);
      const y = 490;

      const isDisabled = card.disabled || i === this.combatContext.disabledCardIndex || i === this.combatContext.lockedCardIndex;

      const bg = this.add.rectangle(x, y, cardWidth, 120,
        isDisabled ? 0x333333 : card.getColor(), isDisabled ? 0.3 : 0.7)
        .setStrokeStyle(2, isDisabled ? 0x444444 : 0xffffff);

      let typeLabel = 'ATK';
      if (card.type === CARD_TYPES.DEFENSE) typeLabel = 'DEF';
      if (card.type === CARD_TYPES.SKILL) typeLabel = 'SKL';

      this.add.text(x, y - 45, typeLabel, {
        fontSize: '10px', fontFamily: 'Arial Black', color: '#ffffff',
        backgroundColor: '#00000088', padding: { x: 3, y: 1 },
      }).setOrigin(0.5);

      this.add.text(x, y - 15, card.name, {
        fontSize: '10px', fontFamily: 'Arial Black', color: '#ffffff',
        wordWrap: { width: cardWidth - 8 }, align: 'center',
      }).setOrigin(0.5);

      if (card.baseValue > 0) {
        this.add.text(x, y + 15, `${card.baseValue}`, {
          fontSize: '18px', fontFamily: 'Arial Black', color: '#ffdd88',
        }).setOrigin(0.5);
      }

      if (!isDisabled && this.combatState === CombatSystem.COMBAT_STATE.SELECT_CARD) {
        bg.setInteractive({ useHandCursor: true });

        bg.on('pointerover', () => {
          bg.setStrokeStyle(3, 0xffcc00);
          bg.setY(y - 10);
        });

        bg.on('pointerout', () => {
          bg.setStrokeStyle(2, 0xffffff);
          bg.setY(y);
        });

        bg.on('pointerdown', () => {
          this.selectCard(card, i);
        });
      }

      this.cardObjects.push(bg);
    });
  }

  selectCard(card, index) {
    this.selectedCard = card;

    if (card.type === CARD_TYPES.SKILL) {
      const result = card.apply(this.player, this.enemy, 0);
      this.messageText.setText(result.message);

      if (result.skill === 'freeze_time') {
        this.combatContext.timerReduction = -4000;
      } else if (result.skill === 'clear_mind') {
        this.combatContext.clearMind = true;
      } else if (result.skill === 'double_power') {
        this.combatContext.doublePower = true;
      }

      this.updateHP();
      this.time.delayedCall(1500, () => {
        this.doEnemyTurn();
      });
      return;
    }

    this.combatState = CombatSystem.COMBAT_STATE.MATH_PROBLEM;
    this.currentProblem = MathSystem.generate(this.worldLevel);
    this.problemText.setText(`${this.currentProblem.text} = ?`);
    this.inputText = '';
    this.inputBg.setVisible(true);
    this.inputDisplay.setVisible(true).setText('_');

    this.timerStartTime = Date.now();
    this.timerBarFill.setVisible(true);
    this.timerActive = true;
  }

  setupKeyboardInput() {
    this.input.keyboard.on('keydown', (event) => {
      if (this.combatState !== CombatSystem.COMBAT_STATE.MATH_PROBLEM) return;

      if (event.key === 'Enter') {
        this.submitAnswer();
      } else if (event.key === 'Backspace') {
        this.inputText = this.inputText.slice(0, -1);
        this.inputDisplay.setText(this.inputText || '_');
      } else if (event.key === '-' && this.inputText.length === 0) {
        this.inputText = '-';
        this.inputDisplay.setText(this.inputText);
      } else if (/^[0-9]$/.test(event.key)) {
        this.inputText += event.key;
        this.inputDisplay.setText(this.inputText);
      }
    });
  }

  submitAnswer() {
    if (this.inputText === '' || this.inputText === '-') return;

    this.timerActive = false;
    const elapsed = Date.now() - this.timerStartTime + this.combatContext.timerReduction;

    const result = CombatSystem.evaluatePlayerAction(
      this.selectedCard, this.currentProblem, this.inputText, Math.max(0, elapsed)
    );

    let effectValue = result.effect;
    if (this.combatContext.doublePower) {
      effectValue *= 2;
      this.combatContext.doublePower = false;
    }
    effectValue = Math.round(effectValue * this.combatContext.cardEffectivenessModifier);

    if (result.success) {
      const cardResult = this.selectedCard.apply(this.player, this.enemy, effectValue);
      this.messageText.setText(`Correct! ${cardResult.message}`);

      if (this.selectedCard.type === CARD_TYPES.DEFENSE) {
        this.activeDefense = effectValue;
      }
    } else {
      this.messageText.setText('Wrong answer or too slow! No effect.');
    }

    this.combatContext.cardEffectivenessModifier = 1;
    this.combatContext.timerReduction = 0;

    this.inputBg.setVisible(false);
    this.inputDisplay.setVisible(false);
    this.timerBarFill.setVisible(false);
    this.problemText.setText('');
    this.updateHP();

    if (CombatSystem.checkWin(this.enemy)) {
      this.handleWin();
      return;
    }

    this.time.delayedCall(1200, () => {
      this.doEnemyTurn();
    });
  }

  doEnemyTurn() {
    this.combatState = CombatSystem.COMBAT_STATE.ENEMY_TURN;

    const action = this.enemy.getAction();
    let msg = '';

    if (action === 'skill') {
      const skillResult = this.enemy.useSkill(this.player, this.combatContext);
      msg = skillResult ? skillResult.message : '';

      if (!this.combatContext.enemySkipAttack) {
        let damage = this.enemy.attackPower;
        damage = Math.round(damage * this.combatContext.enemyDamageBoost);
        CombatSystem.enemyTurn(this.enemy, this.player, this.activeDefense);
        msg += `\n${this.enemy.name} attacks for ${damage} damage!`;
      }
    } else {
      let damage = this.enemy.attackPower;
      damage = Math.round(damage * this.combatContext.enemyDamageBoost);
      CombatSystem.enemyTurn(
        { ...this.enemy, attackPower: damage },
        this.player,
        this.activeDefense
      );
      msg = `${this.enemy.name} attacks for ${damage} damage!`;
      if (this.activeDefense > 0) {
        msg += ` (Blocked ${this.activeDefense})`;
      }
    }

    if (this.combatContext.enemyDoubleAction) {
      const bonusDmg = this.enemy.attackPower;
      this.player.takeDamage(bonusDmg);
      msg += `\nDouble action! Extra ${bonusDmg} damage!`;
      this.combatContext.enemyDoubleAction = false;
    }

    this.combatContext.enemyDamageBoost = 1;
    this.combatContext.enemySkipAttack = false;
    this.activeDefense = 0;

    this.messageText.setText(msg);
    this.updateHP();

    if (CombatSystem.checkLose(this.player)) {
      this.handleLose();
      return;
    }

    this.time.delayedCall(1500, () => {
      this.startNewTurn();
    });
  }

  startNewTurn() {
    this.combatState = CombatSystem.COMBAT_STATE.SELECT_CARD;
    this.problemText.setText('Select a card');
    this.messageText.setText('');
    this.selectedCard = null;

    this.cardObjects.forEach((obj) => obj.destroy());
    this.cardObjects = [];
    this.drawCards();
  }

  handleWin() {
    this.combatState = CombatSystem.COMBAT_STATE.WIN;
    const map = this.registry.get('currentMap');
    if (map) {
      const node = map.nodes[map.currentNode];
      if (node) node.completed = true;
    }

    this.messageText.setText('VICTORY!');
    this.problemText.setText(`${this.enemy.name} defeated!`).setColor('#44ff44');

    this.time.delayedCall(2000, () => {
      this.player.levelUp();
      this.scene.start('RewardScene', {
        worldLevel: this.worldLevel,
        isBoss: this.isBoss,
        chestReward: false,
      });
    });
  }

  handleLose() {
    this.combatState = CombatSystem.COMBAT_STATE.LOSE;
    this.messageText.setText('DEFEAT...');
    this.problemText.setText('You have been defeated!').setColor('#ff4444');

    this.time.delayedCall(2500, () => {
      this.player.onDefeat();
      this.registry.set('currentMap', null);
      this.scene.start('HomeScene');
    });
  }

  updateHP() {
    const pRatio = this.player.getHpRatio();
    this.playerHpFill.setDisplaySize(pRatio * 140, 14);
    this.playerHpFill.setX(120 - 70 + (pRatio * 140) / 2);
    this.playerHpFill.setFillStyle(pRatio > 0.5 ? 0x44ff44 : pRatio > 0.25 ? 0xffff00 : 0xff4444);
    this.playerHpText.setText(`${this.player.hp}/${this.player.maxHp}`);

    const eRatio = this.enemy.getHpRatio();
    this.enemyHpFill.setDisplaySize(eRatio * 140, 14);
    this.enemyHpFill.setX(650 - 70 + (eRatio * 140) / 2);
    this.enemyHpText.setText(`${this.enemy.hp}/${this.enemy.maxHp}`);
  }

  update() {
    if (!this.timerActive) return;

    const elapsed = Date.now() - this.timerStartTime;
    const ratio = TimerSystem.getRatio(elapsed);
    const color = TimerSystem.getZoneColor(elapsed);

    this.timerBarFill.setDisplaySize(ratio * 500, 18);
    this.timerBarFill.setFillStyle(color);

    if (TimerSystem.isExpired(elapsed)) {
      this.timerActive = false;
      this.submitAnswer();
    }
  }

  startTrapChallenge() {
    this.combatState = CombatSystem.COMBAT_STATE.MATH_PROBLEM;
    this.currentProblem = MathSystem.generate(this.worldLevel);
    this.problemText.setText(`TRAP! Solve: ${this.currentProblem.text} = ?`);
    this.inputText = '';
    this.inputBg.setVisible(true);
    this.inputDisplay.setVisible(true).setText('_');
    this.timerStartTime = Date.now();
    this.timerBarFill.setVisible(true);
    this.timerActive = true;
    this.messageText.setText('Solve the problem to escape the trap!');
  }
}
