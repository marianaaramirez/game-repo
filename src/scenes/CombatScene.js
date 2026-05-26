/**
 * CombatScene.js
 * Core combat screen for Math Smash: Card Adventure.
 * Implements a turn-based battle loop where every card action requires
 * solving a math problem within a countdown timer.
 *
 * Combat flow per turn:
 *   1. SELECT_CARD — player clicks a card from their hand
 *   2. MATH_PROBLEM — a problem appears; timer starts; player types answer
 *   3. EVALUATE — CombatSystem grades the answer + timer and computes effect
 *   4. ENEMY_TURN — enemy attacks or uses a skill
 *   Repeat until one side reaches 0 HP.
 *
 * Special entry modes:
 *   - Normal battle: enemy loaded from registry, full turn loop
 *   - trapChallenge: single math problem, no enemy; win = escape trap
 *
 * Timer color zones (inherited from TimerSystem):
 *   GREEN  → 100% effect   YELLOW → 75%   RED → 50%   Expired → 0%
 *
 * CombatContext object carries per-turn modifiers that enemy skills can mutate:
 *   cardEffectivenessModifier, timerReduction, disabledCardIndex, etc.
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import Phaser from 'phaser';
import MathSystem from '../systems/MathSystem.js';
import TimerSystem from '../systems/TimerSystem.js';
import CombatSystem from '../systems/CombatSystem.js';
import { CARD_TYPES } from '../cards/BaseCard.js';

export default class CombatScene extends Phaser.Scene {
  constructor() {
    super('CombatScene');
  }

  /**
   * Receives context from the previous scene.
   * @param {{ worldLevel: number, trapChallenge?: boolean }} data
   */
  init(data) {
    this.worldLevel    = data.worldLevel    || 1;
    this.trapChallenge = data.trapChallenge || false;
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a1a');

    // Pull shared state from global registry
    this.player = this.registry.get('player');
    this.enemy  = this.registry.get('currentEnemy');
    this.isBoss = this.registry.get('isBoss') || false;

    // --- Combat state ---
    this.combatState    = CombatSystem.COMBAT_STATE.SELECT_CARD;
    this.currentProblem = null;
    this.timerStartTime = 0;
    // Time allowed per problem — higher levels get more time (harder math)
    this.timerDuration  = TimerSystem.getDuration(this.worldLevel);
    this.selectedCard   = null;
    this.activeDefense  = 0;   // Defense value blocks enemy damage this turn
    this.inputText      = '';  // Accumulates keyboard digits for the answer field

    /**
     * combatContext — mutable object shared with enemy skill methods.
     * Enemy useSkill() implementations write flags here so CombatScene
     * can apply the modifiers at the right point in the turn sequence.
     */
    this.combatContext = {
      cardEffectivenessModifier: 1,    // Multiplier on card effect (Slime reduces this)
      enemyDamageReduction:      0,    // Flat damage reduction for player (unused by default)
      disabledCardIndex:        -1,    // Card index grayed out (Spider web trap)
      lockedCardIndex:          -1,    // Card index locked (CardThief steal)
      enemyStrikesFirst:       false,  // PredatorPlant quick strike
      enemyDoubleAction:       false,  // VampireKing attacks twice
      enemyDamageBoost:            1,  // Multiplier on enemy damage (BoneMage)
      timerReduction:              0,  // Subtract ms from elapsed (EvilBat slows timer)
      enemySkipAttack:         false,  // Titan charges — skip normal attack
      swapRandomCard:          false,  // Swapper chaos — card gets randomized
      secondChance:            false,  // SecondChance skill — allow one retry on wrong answer
      playerDeck: this.player.getActiveDeck(),
    };

    this.drawBattleUI();
    this.drawCards();
    this.setupKeyboardInput();

    // Trap challenge skips card selection and jumps straight to a math problem
    if (this.trapChallenge) {
      this.startTrapChallenge();
    }
  }

  /**
   * Renders all static UI elements: player/enemy sprites, HP bars, timer bar,
   * math problem area, answer input box, and message display.
   */
  drawBattleUI() {
    // --- Player side (left) ---
    this.add.text(120, 30, this.player.name, {
      fontSize: '18px', fontFamily: 'Arial Black', color: '#44aaff',
    }).setOrigin(0.5);

    // Map skin index to matching body color (mirrors CharSelectScene SKINS array)
    const skinColors = [0x4488ff, 0xaa44ff, 0x44ff88];
    const skinColor  = skinColors[this.player.skinIndex] || 0x4488ff;

    // Simple pixel-art figure: rectangle body + circle head + dot eyes
    this.add.rectangle(120, 130, 60, 80, skinColor, 0.9).setStrokeStyle(2, 0xffffff);
    this.add.circle(120, 75, 25, skinColor).setStrokeStyle(2, 0xffffff);
    this.add.circle(113, 70, 3, 0xffffff);
    this.add.circle(127, 70, 3, 0xffffff);

    // Player HP bar — background track + colored fill
    this.playerHpBar  = this.add.rectangle(120, 190, 140, 16, 0x333333).setStrokeStyle(1, 0x666666);
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

    // --- Enemy side (right) ---
    this.add.text(650, 30, this.enemy.name, {
      fontSize: '18px', fontFamily: 'Arial Black',
      color: this.isBoss ? '#ff4444' : '#ff8844', // Red for bosses, orange for normals
    }).setOrigin(0.5);

    // Boss sprites are drawn larger to convey difficulty
    const enemySize = this.isBoss ? 50 : 35;
    this.add.rectangle(650, 120, enemySize * 1.5, enemySize * 2, this.enemy.color, 0.9)
      .setStrokeStyle(2, 0xff4444);

    if (this.isBoss) {
      this.add.text(650, 60, 'BOSS', {
        fontSize: '12px', fontFamily: 'Arial Black', color: '#ff0000',
        backgroundColor: '#000000aa', padding: { x: 6, y: 2 },
      }).setOrigin(0.5);
    }

    // Enemy HP bar
    this.enemyHpBar  = this.add.rectangle(650, 190, 140, 16, 0x333333).setStrokeStyle(1, 0x666666);
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

    // --- Timer bar (center) ---
    // Visible only while a math problem is active; color reflects time zone
    this.add.text(400, 225, 'TIMER', {
      fontSize: '12px', fontFamily: 'Arial', color: '#888888',
    }).setOrigin(0.5);
    this.timerBarBg   = this.add.rectangle(400, 245, 500, 20, 0x333333).setStrokeStyle(1, 0x666666);
    this.timerBarFill = this.add.rectangle(150, 245, 500, 18, 0x00ff00).setOrigin(0, 0.5);
    this.timerBarFill.setVisible(false);

    // Math problem display — replaced each turn with a generated question
    this.problemText = this.add.text(400, 290, 'Select a card to begin', {
      fontSize: '24px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);

    // Answer input box — shown only while MATH_PROBLEM state is active
    this.inputBg = this.add.rectangle(400, 340, 200, 40, 0x222244, 0.9)
      .setStrokeStyle(2, 0x4466aa).setVisible(false);
    this.inputDisplay = this.add.text(400, 340, '', {
      fontSize: '24px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5).setVisible(false);

    // Message area — shows result feedback and enemy action descriptions
    this.messageText = this.add.text(400, 385, '', {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffcc00',
      wordWrap: { width: 600 }, align: 'center',
    }).setOrigin(0.5);
  }

  /**
   * Renders the player's hand as clickable card rectangles at the bottom of the screen.
   * Disabled/locked cards are grayed out and non-interactive.
   * Called at the start of every turn to reflect any card state changes.
   */
  drawCards() {
    this.cardObjects = [];
    const deck    = this.combatContext.playerDeck;
    const cardWidth = 100;
    const startX  = 400 - ((deck.length - 1) * (cardWidth + 10)) / 2;

    deck.forEach((card, i) => {
      const x = startX + i * (cardWidth + 10);
      const y = 490;

      // Gray out cards affected by enemy skills (spider web, card thief)
      const isDisabled = card.disabled
        || i === this.combatContext.disabledCardIndex
        || i === this.combatContext.lockedCardIndex;

      const bg = this.add.rectangle(x, y, cardWidth, 120,
        isDisabled ? 0x333333 : card.getColor(), isDisabled ? 0.3 : 0.7)
        .setStrokeStyle(2, isDisabled ? 0x444444 : 0xffffff);

      // Type badge (ATK / DEF / SKL)
      let typeLabel = 'ATK';
      if (card.type === CARD_TYPES.DEFENSE) typeLabel = 'DEF';
      if (card.type === CARD_TYPES.SKILL)   typeLabel = 'SKL';

      this.add.text(x, y - 45, typeLabel, {
        fontSize: '10px', fontFamily: 'Arial Black', color: '#ffffff',
        backgroundColor: '#00000088', padding: { x: 3, y: 1 },
      }).setOrigin(0.5);

      this.add.text(x, y - 15, card.name, {
        fontSize: '10px', fontFamily: 'Arial Black', color: '#ffffff',
        wordWrap: { width: cardWidth - 8 }, align: 'center',
      }).setOrigin(0.5);

      // Skill cards have baseValue 0, so omit the power label for them
      if (card.baseValue > 0) {
        this.add.text(x, y + 15, `${card.baseValue}`, {
          fontSize: '18px', fontFamily: 'Arial Black', color: '#ffdd88',
        }).setOrigin(0.5);
      }

      // Only interactive cards in SELECT_CARD state get pointer events
      if (!isDisabled && this.combatState === CombatSystem.COMBAT_STATE.SELECT_CARD) {
        bg.setInteractive({ useHandCursor: true });

        bg.on('pointerover', () => {
          bg.setStrokeStyle(3, 0xffcc00);
          bg.setY(y - 10); // Slight lift on hover for visual feedback
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

  /**
   * Handles card selection.
   * Skill cards apply immediately without a math problem.
   * Attack and defense cards trigger a math problem and start the timer.
   * {BaseCard} card    - The selected card
   * {number}   index   - Index in the active deck (used for context flags)
   */
  selectCard(card, index) {
    this.selectedCard = card;

    // Skill cards: apply effect immediately, then pass turn to the enemy
    if (card.type === CARD_TYPES.SKILL) {
      const result = card.apply(this.player, this.enemy, 0);
      this.messageText.setText(result.message);

      // Propagate skill flags to combatContext so they affect the upcoming turn
      if (result.skill === 'freeze_time') {
        this.combatContext.timerReduction = -4000; // Negative = effectively more time
      } else if (result.skill === 'clear_mind') {
        this.combatContext.clearMind = true;
      } else if (result.skill === 'double_power') {
        this.combatContext.doublePower = true;
      } else if (result.skill === 'second_chance') {
        this.combatContext.secondChance = true;
      }

      this.updateHP();
      this.time.delayedCall(1500, () => {
        this.doEnemyTurn();
      });
      return;
    }

    // ClearMind: skip math problem entirely, activate card at full base power
    if (this.combatContext.clearMind) {
      this.combatContext.clearMind = false;
      const cardResult = card.apply(this.player, this.enemy, card.baseValue);
      this.messageText.setText(`Clear Mind! ${cardResult.message}`);
      if (card.type === CARD_TYPES.DEFENSE) {
        this.activeDefense = card.baseValue;
      }
      this.updateHP();
      if (CombatSystem.checkWin(this.enemy)) { this.handleWin(); return; }
      this.time.delayedCall(1200, () => { this.doEnemyTurn(); });
      return;
    }

    // Attack / Defense cards: generate a math problem and start the timer
    this.combatState    = CombatSystem.COMBAT_STATE.MATH_PROBLEM;

    // Lock all cards — no switching allowed once problem is shown
    this.cardObjects.forEach((obj) => obj.disableInteractive());

    this.currentProblem = MathSystem.generate(this.worldLevel);
    this.problemText.setText(`${this.currentProblem.text} = ?`);
    this.inputText = '';
    this.inputBg.setVisible(true);
    this.inputDisplay.setVisible(true).setText('_');

    this.timerStartTime = Date.now();
    this.timerBarFill.setVisible(true);
    this.timerActive = true;
  }

  /**
   * Wires keyboard events for answer input.
   * Only active while in MATH_PROBLEM state.
   * Supports: digits 0–9, Backspace (delete last char), minus sign (negative answers), Enter (submit).
   */
  setupKeyboardInput() {
    this.input.keyboard.on('keydown', (event) => {
      if (this.combatState !== CombatSystem.COMBAT_STATE.MATH_PROBLEM) return;

      if (event.key === 'Enter') {
        this.submitAnswer();
      } else if (event.key === 'Backspace') {
        this.inputText = this.inputText.slice(0, -1);
        this.inputDisplay.setText(this.inputText || '_');
      } else if (event.key === '-' && this.inputText.length === 0) {
        // Allow leading minus for negative number answers
        this.inputText = '-';
        this.inputDisplay.setText(this.inputText);
      } else if (/^[0-9]$/.test(event.key)) {
        this.inputText += event.key;
        this.inputDisplay.setText(this.inputText);
      }
    });
  }

  /**
   * Evaluates the player's typed answer against the current problem and timer.
   * Applies the card effect if correct, then resets state and triggers enemy turn.
   * Also called automatically by update() when the timer expires (inputText may be empty).
   */
  submitAnswer() {
    if (this.inputText === '' || this.inputText === '-') return;

    this.timerActive = false;

    // Clamp elapsed to 0 so negative timerReduction (freeze time) doesn't go below 0
    const elapsed = Date.now() - this.timerStartTime + this.combatContext.timerReduction;

    const result = CombatSystem.evaluatePlayerAction(
      this.selectedCard, this.currentProblem, this.inputText,
      Math.max(0, elapsed), this.timerDuration
    );

    // Apply double power skill bonus before any other modifiers
    let effectValue = result.effect;
    if (this.combatContext.doublePower) {
      effectValue *= 2;
      this.combatContext.doublePower = false;
    }
    // Apply Slime cardEffectivenessModifier (rounds down)
    effectValue = Math.round(effectValue * this.combatContext.cardEffectivenessModifier);

    if (result.success) {
      const cardResult = this.selectedCard.apply(this.player, this.enemy, effectValue);
      this.messageText.setText(`Correct! ${cardResult.message}`);

      // Store defense value so enemy attack this turn can be reduced
      if (this.selectedCard.type === CARD_TYPES.DEFENSE) {
        this.activeDefense = effectValue;
      }
    } else {
      // SecondChance: one free retry on wrong answer or timeout
      if (this.combatContext.secondChance) {
        this.combatContext.secondChance = false;
        this.messageText.setText('Wrong! Second Chance — try again!');
        this.inputText = '';
        this.inputDisplay.setText('_');
        this.inputBg.setVisible(true);
        this.inputDisplay.setVisible(true);
        this.timerStartTime = Date.now();
        this.timerBarFill.setVisible(true);
        this.timerActive = true;
        return; // Skip enemy turn — player gets another attempt
      }
      this.messageText.setText('Wrong answer or too slow! No effect.');
    }

    // Reset per-turn modifiers
    this.combatContext.cardEffectivenessModifier = 1;
    this.combatContext.timerReduction            = 0;

    // Hide input / timer UI
    this.inputBg.setVisible(false);
    this.inputDisplay.setVisible(false);
    this.timerBarFill.setVisible(false);
    this.problemText.setText('');
    this.updateHP();

    // Check if enemy died from the card effect
    if (CombatSystem.checkWin(this.enemy)) {
      this.handleWin();
      return;
    }

    this.time.delayedCall(1200, () => {
      this.doEnemyTurn();
    });
  }

  /**
   * Runs the enemy's action for the current turn.
   * Rolls getAction() to decide attack vs. skill.
   * Handles skill side-effects (double action, damage boost, skip attack)
   * written into combatContext by the enemy's useSkill() implementation.
   */
  doEnemyTurn() {
    this.combatState = CombatSystem.COMBAT_STATE.ENEMY_TURN;

    const action = this.enemy.getAction();
    let msg = '';

    if (action === 'skill') {
      // Enemy uses its unique skill — may mutate combatContext
      const skillResult = this.enemy.useSkill(this.player, this.combatContext);
      msg = skillResult ? skillResult.message : '';

      // Skill enemies also attack unless the skill flagged a skip (Titan charging)
      if (!this.combatContext.enemySkipAttack) {
        let damage = this.enemy.attackPower;
        damage = Math.round(damage * this.combatContext.enemyDamageBoost);
        CombatSystem.enemyTurn(this.enemy, this.player, this.activeDefense);
        msg += `\n${this.enemy.name} attacks for ${damage} damage!`;
      }
    } else {
      // Standard attack — spread a modified clone to pass boosted damage cleanly
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

    // VampireKing double action — second hit after the main turn
    if (this.combatContext.enemyDoubleAction) {
      const bonusDmg = this.enemy.attackPower;
      this.player.takeDamage(bonusDmg);
      msg += `\nDouble action! Extra ${bonusDmg} damage!`;
      this.combatContext.enemyDoubleAction = false;
    }

    // Reset turn-scoped context flags
    this.combatContext.enemyDamageBoost  = 1;
    this.combatContext.enemySkipAttack   = false;
    this.activeDefense = 0;

    this.messageText.setText(msg);
    this.updateHP();

    // Check defeat after enemy attack
    if (CombatSystem.checkLose(this.player)) {
      this.handleLose();
      return;
    }

    this.time.delayedCall(1500, () => {
      this.startNewTurn();
    });
  }

  /**
   * Resets state for the next turn: clears card objects and redraws the hand.
   */
  startNewTurn() {
    this.combatState  = CombatSystem.COMBAT_STATE.SELECT_CARD;
    this.problemText.setText('Select a card');
    this.messageText.setText('');
    this.selectedCard = null;

    // Clear per-turn card disable flags so they don't persist beyond one turn
    this.combatContext.disabledCardIndex = -1;
    this.combatContext.lockedCardIndex   = -1;

    // Destroy old card GameObjects and redraw to reflect any state changes
    this.cardObjects.forEach((obj) => obj.destroy());
    this.cardObjects = [];
    this.drawCards();
  }

  /**
   * Called when the enemy reaches 0 HP.
   * Marks the map node completed, levels up the player, then transitions to RewardScene.
   */
  handleWin() {
    this.combatState = CombatSystem.COMBAT_STATE.WIN;

    // Mark the current map node as completed so MapScene renders it correctly
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
        isBoss:     this.isBoss,
        chestReward: false,
      });
    });
  }

  /**
   * Called when the player reaches 0 HP.
   * Strips the normal deck (keeps skill cards), clears the map, returns to HomeScene.
   */
  handleLose() {
    this.combatState = CombatSystem.COMBAT_STATE.LOSE;
    this.messageText.setText('DEFEAT...');
    this.problemText.setText('You have been defeated!').setColor('#ff4444');

    this.time.delayedCall(2500, () => {
      this.player.onDefeat();              // Wipe deck, preserve skill cards
      this.registry.set('currentMap', null); // Force new map on next run
      this.scene.start('HomeScene');
    });
  }

  /**
   * Refreshes both HP bars and HP text labels to reflect current values.
   * Bar fill color shifts: green > 50% HP, yellow 26–50%, red ≤ 25%.
   */
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

  /**
   * Phaser's per-frame update hook.
   * Shrinks the timer bar and triggers auto-submit when time runs out.
   * Only runs while timerActive is true (i.e., a math problem is open).
   */
  update() {
    if (!this.timerActive) return;

    // Apply timerReduction so FreezeTime slows the visual bar too
    const elapsed = Math.max(0, Date.now() - this.timerStartTime + this.combatContext.timerReduction);
    const ratio   = TimerSystem.getRatio(elapsed, this.timerDuration);
    const color   = TimerSystem.getZoneColor(elapsed, this.timerDuration);

    // Scale bar width and update color to reflect current time zone
    this.timerBarFill.setDisplaySize(ratio * 500, 18);
    this.timerBarFill.setFillStyle(color);

    // Auto-submit with empty answer on timeout (results in 0 effect)
    if (TimerSystem.isExpired(elapsed, this.timerDuration)) {
      this.timerActive = false;
      this.submitAnswer();
    }
  }

  /**
   * Starts a trap challenge: skips card selection and immediately presents a math problem.
   * Used when a TRAP chest rolls the math-challenge outcome (no enemy combat).
   * Solving correctly lets the player escape; timeout/wrong = no penalty (node already marked complete).
   */
  startTrapChallenge() {
    this.combatState    = CombatSystem.COMBAT_STATE.MATH_PROBLEM;
    this.currentProblem = MathSystem.generate(this.worldLevel);
    this.problemText.setText(`TRAP! Solve: ${this.currentProblem.text} = ?`);
    this.inputText = '';
    this.inputBg.setVisible(true);
    this.inputDisplay.setVisible(true).setText('_');
    this.timerStartTime = Date.now();
    this.timerBarFill.setVisible(true);
    this.timerActive    = true;
    this.messageText.setText('Solve the problem to escape the trap!');
  }
}
