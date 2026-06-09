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
import { postProblem, postCombat, updateRun, wipeDeck, saveRun, deleteRunSave, getEnemyIDByName, getCardIDByName } from '../api.js';
import { drawBackButton, showConfirmDialog, showToast } from '../ui/uiHelpers.js';

//For the sprites (vite needs to acces to every png):
import warriorIdle from '../assets/Player_sprites/Warrior/warrior_Idle.png';
import warriorAttack from '../assets/Player_sprites/Warrior/warrior_Attack.png';
import warriorHurt from '../assets/Player_sprites/Warrior/warrior_Hurt.png';
import warriorDeath from '../assets/Player_sprites/Warrior/warrior_Death.png';

import mageIdle from '../assets/Player_sprites/Mage/mage_Idle.png';
import mageAttack from '../assets/Player_sprites/Mage/mage_Attack.png';
import mageHurt from '../assets/Player_sprites/Mage/mage_Hurt.png';
import mageDeath from '../assets/Player_sprites/Mage/mage_Death.png';

import rogueIdle from '../assets/Player_sprites/Rogue/rogue_Idle.png';
import rogueAttack from '../assets/Player_sprites/Rogue/rogue_Attack.png';
import rogueHurt from '../assets/Player_sprites/Rogue/rogue_Hurt.png';
import rogueDeath from '../assets/Player_sprites/Rogue/rogue_Death.png';

const SPRITES = {
  warrior: {
    Idle: warriorIdle,
    Attack: warriorAttack,
    Hurt: warriorHurt,
    Death: warriorDeath
  },
  mage: {
    Idle: mageIdle,
    Attack: mageAttack,
    Hurt: mageHurt,
    Death: mageDeath
  },
  rogue: {
    Idle: rogueIdle,
    Attack: rogueAttack,
    Hurt: rogueHurt,
    Death: rogueDeath
  }
};


function getRowFrames(cfg, animFrames) {
  const start = cfg.row * cfg.framesPerRow;
  return {
    start,
    end: start + animFrames - 1
  };
}

export default class CombatScene extends Phaser.Scene {
  constructor() {
    super('CombatScene');
  }

  preload() {
    Object.entries(SPRITES).forEach(([skin, animations]) => {
      Object.entries(animations).forEach(([anim, asset]) => {
        this.load.spritesheet(
          `${skin}_${anim}`,
          asset,
          {
            frameWidth: 32,
            frameHeight: 32
          }
        );
      });
    });

    const enemy = this.registry.get('currentEnemy');
    const cfg = enemy.spriteConfig;
    Object.entries(cfg.assets).forEach(([anim, asset]) => {
      this.load.spritesheet(`${cfg.key}_${anim}`, asset, {
        frameWidth: cfg.frameWidth,
        frameHeight: cfg.frameHeight
      });
    });
  }
  /**
   * Receives context from the previous scene.
   * @param {{ worldLevel: number, trapChallenge?: boolean }} data
   */
  init(data) {
    this.worldLevel = data.worldLevel || 1;
    this.nodeIndex = data.nodeIndex || 0;
    this.battleNumber = data.battleNumber || null;
    this.trapChallenge = data.trapChallenge || false;
    // Optional combat-restore payload from SavedGamesScene
    this.combatRestore = data.combatRestore || null;
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a1a');
    // Pull shared state from global registry
    this.player = this.registry.get('player');
    this.enemy = this.registry.get('currentEnemy');
    this.enemyKey = this.enemy.getSpriteKey();
    this.isBoss = this.registry.get('isBoss') || false;

    const skins = ['warrior', 'mage', 'rogue'];
    this.skinKey = skins[this.player.skinIndex] || 'warrior';
    this.createAnimations();

    // Per-combat reset: skill card uses (2 per combat). ATK/DEF cycle instead.
    if (!this.combatRestore && this.player.resetCardUses) {
      this.player.resetCardUses();
    }

    // --- Card cycling state ---
    // ATK/DEF cards cycle through the hand. First 4 = hand, rest = queue.
    // When a card is used, it exits the hand → usedPile. Next card from queue enters.
    // When queue is empty, usedPile recycles back into queue.
    const orderedCards = [...this.player.deck]; // copy to avoid mutating player state
    this.cardHand  = orderedCards.slice(0, 4);
    this.cardQueue = orderedCards.slice(4);
    this.usedPile  = [];

    // --- Combat state ---
    this.combatState = CombatSystem.COMBAT_STATE.SELECT_CARD;
    this.currentProblem = null;
    this.timerStartTime = 0;
    this.timerDuration = TimerSystem.getDuration(this.worldLevel) + (this.player.timerBonus || 0);
    this.selectedCard = null;
    this.activeDefense = 0;
    this.inputText = '';

    /**
     * combatContext — mutable object shared with enemy skill methods.
     */
    this.combatContext = {
      cardEffectivenessModifier: 1,
      enemyDamageReduction: 0,
      disabledCard: null,         // Card ref grayed out (Spider web trap)
      lockedCard: null,           // Card ref locked (CardThief steal)
      enemyStrikesFirst: false,
      enemyDoubleAction: false,
      enemyDamageBoost: 1,
      timerReduction: 0,
      enemySkipAttack: false,
      swapRandomCard: false,
      secondChance: false,
      rogueCounter: 0,
      playerRegen: 0,
      playerRegenAmount: 0,
      tauntForceSkill: false,
      evadeChance: 0,
      barrierTurns: 0,
      playerDeck: this.buildVisibleDeck(),
    };

    // --- Backend tracking (separate from combatContext so it isn't reset by enemy turn) ---
    this.cardsUsedThisCombat = [];     // [{ cardID, turn_number }]
    this.turnCount = 1;
    this.totalDamageDealt = 0;
    this.lastProblemID = null;

    // If a combat-restore payload is present, override the freshly-built state.
    if (this.combatRestore) {
      this.applyCombatRestore(this.combatRestore);
    }

    this.drawBattleUI();
    this.drawCards();
    this.setupKeyboardInput();

    // Forfeit button — abandons combat, marks run as lose, wipes deck.
    // Positioned bottom-right where no other combat UI lives.
    this.forfeitButton = drawBackButton(this, 'LevelSelectScene', {
      x: 740, y: 580,
      label: 'FORFEIT',
      confirmMessage: 'Forfeit combat? Your run ends. Collection preserved.',
      onBeforeNavigate: () => this.forfeitCombat(),
    });

    // Pause button — saves progress and exits to HomeScene. Disabled while a
    // math problem is on screen (player would lose answer mid-typing).
    this.pauseButton = this.drawPauseButton();

    // Trap challenge skips card selection and jumps straight to a math problem
    if (this.trapChallenge) {
      this.startTrapChallenge();
    }
  }

  createAnimations() {
    const skins = ['warrior', 'mage', 'rogue'];
    skins.forEach((skin) => {
      if (!this.anims.exists(`${skin}_Idle`)) {
        this.anims.create({
          key: `${skin}_Idle`,
          frames: this.anims.generateFrameNumbers(`${skin}_Idle`, {
            start: 0,
            end: 3
          }),
          frameRate: 6,
          repeat: -1
        });
      }

      if (!this.anims.exists(`${skin}_Attack`)) {
        this.anims.create({
          key: `${skin}_Attack`,
          frames: this.anims.generateFrameNumbers(`${skin}_Attack`, {
            start: 0,
            end: 3
          }),
          frameRate: 8,
          repeat: 0
        });
      }

      if (!this.anims.exists(`${skin}_Hurt`)) {
        this.anims.create({
          key: `${skin}_Hurt`,
          frames: this.anims.generateFrameNumbers(`${skin}_Hurt`, {
            start: 0,
            end: 3
          }),
          frameRate: 8,
          repeat: 0
        });
      }

      if (!this.anims.exists(`${skin}_Death`)) {
        this.anims.create({
          key: `${skin}_Death`,
          frames: this.anims.generateFrameNumbers(`${skin}_Death`, {
            start: 0,
            end: 7
          }),
          frameRate: 3,
          repeat: 0
        });
      }

    });

    const enemy = this.registry.get('currentEnemy');
    const cfg = enemy.spriteConfig;
    const anims = cfg.anims;
    Object.entries(anims).forEach(([name, a]) => {
      if (!this.anims.exists(`${cfg.key}_${name}`)) {
        //const base = 0; 
        //const base = cfg.row * cfg.framesPerRow;
        const base = cfg.row;
        this.anims.create({
          key: `${cfg.key}_${name}`,
          // frames: this.anims.generateFrameNumbers(`${cfg.key}_${name}`, {
          //   start: base + a.start,
          //   end: base + a.end
          // }),
          frames: this.anims.generateFrameNumbers(`${cfg.key}_${name}`, {
            start: a.start,
            end: a.end
          }),
          frameRate: a.fps,
          repeat: a.loop ? -1 : 0
        });
      }
    });
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

    const skinMap = ['warrior', 'mage', 'rogue'];
    const key = skinMap[this.player.skinIndex] || 'warrior';

    this.playerSprite = this.add.sprite(120, 120, `${this.skinKey}_Idle`);
    this.playerSprite.setScale(4);
    this.playerSprite.play(`${this.skinKey}_Idle`);

    // Player HP bar — background track + colored fill
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

    // --- Enemy side (right) ---
    this.add.text(650, 30, this.enemy.name, {
      fontSize: '18px', fontFamily: 'Arial Black',
      color: this.isBoss ? '#ff4444' : '#ff8844', // Red for bosses, orange for normals
    }).setOrigin(0.5);

    // Boss sprites are drawn larger to convey difficulty
    //const enemySize = this.isBoss ? 50 : 35;
    this.enemySprite = this.add.sprite(650, 120, `${this.enemyKey}_Idle`);
    this.enemySprite.setScale(4);
    this.enemySprite.play(`${this.enemyKey}_Idle`);

    if (this.isBoss) {
      this.add.text(650, 60, 'BOSS', {
        fontSize: '12px', fontFamily: 'Arial Black', color: '#ff0000',
        backgroundColor: '#000000aa', padding: { x: 6, y: 2 },
      }).setOrigin(0.5);
    }

    // Enemy HP bar
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

    // --- Timer bar (center) ---
    // Visible only while a math problem is active; color reflects time zone
    this.add.text(400, 225, 'TIMER', {
      fontSize: '12px', fontFamily: 'Arial', color: '#888888',
    }).setOrigin(0.5);
    this.timerBarBg = this.add.rectangle(400, 245, 500, 20, 0x333333).setStrokeStyle(1, 0x666666);
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
    const deck = this.combatContext.playerDeck;
    const cardWidth = 100;
    const startX = 400 - ((deck.length - 1) * (cardWidth + 10)) / 2;

    deck.forEach((card, i) => {
      const x = startX + i * (cardWidth + 10);
      const y = 490;

      // Gray out cards affected by enemy skills or depleted skill cards
      const isDepleted = card.isDepleted && card.isDepleted();
      const isDisabled = card.disabled
        || isDepleted
        || card === this.combatContext.disabledCard
        || card === this.combatContext.lockedCard;

      const bg = this.add.rectangle(x, y, cardWidth, 120,
        isDisabled ? 0x333333 : card.getColor(), isDisabled ? 0.3 : 0.7)
        .setStrokeStyle(2, isDisabled ? 0x444444 : 0xffffff);
      this.cardObjects.push(bg);

      // Type badge (ATK / DEF / SKL)
      let typeLabel = 'ATK';
      if (card.type === CARD_TYPES.DEFENSE) typeLabel = 'DEF';
      if (card.type === CARD_TYPES.SKILL)   typeLabel = 'SKL';

      const typeTxt = this.add.text(x, y - 45, typeLabel, {
        fontSize: '10px', fontFamily: 'Arial Black', color: '#ffffff',
        backgroundColor: '#00000088', padding: { x: 3, y: 1 },
      }).setOrigin(0.5);
      this.cardObjects.push(typeTxt);

      const nameTxt = this.add.text(x, y - 15, card.name, {
        fontSize: '10px', fontFamily: 'Arial Black', color: '#ffffff',
        wordWrap: { width: cardWidth - 8 }, align: 'center',
      }).setOrigin(0.5);
      this.cardObjects.push(nameTxt);

      if (card.baseValue > 0) {
        const valTxt = this.add.text(x, y + 15, `${card.baseValue}`, {
          fontSize: '18px', fontFamily: 'Arial Black', color: '#ffdd88',
        }).setOrigin(0.5);
        this.cardObjects.push(valTxt);
      }

      // Uses counter — only for skill cards (maxUsesPerLevel > 0)
      if (card.maxUsesPerLevel) {
        const usesColor = isDepleted ? '#ff4444'
          : card.usesRemaining === 1 ? '#ffaa00'
          : '#88ff88';
        const usesTxt = this.add.text(x, y + 42, `${card.usesRemaining}/${card.maxUsesPerLevel}`, {
          fontSize: '11px', fontFamily: 'Arial Black', color: usesColor,
          backgroundColor: '#00000099', padding: { x: 4, y: 1 },
        }).setOrigin(0.5);
        this.cardObjects.push(usesTxt);
      }

      // Only interactive cards in SELECT_CARD state get pointer events
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
      this.trackCardUsed(card);
      if (card.consumeUse) card.consumeUse();
      // Lock state + cards so user can't fire another action during the 1.5s delay
      this.combatState = CombatSystem.COMBAT_STATE.EVALUATE;
      this.cardObjects.forEach((obj) => obj.disableInteractive());

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
      // Lock state + cards so user can't fire another action during the 1.2s delay
      this.combatState = CombatSystem.COMBAT_STATE.EVALUATE;
      this.cardObjects.forEach((obj) => obj.disableInteractive());

      let effectValue = card.baseValue;
      // Rogue passive: every 2nd successful action doubles effect
      if (this.player.rogueDouble) {
        this.combatContext.rogueCounter = (this.combatContext.rogueCounter || 0) + 1;
        if (this.combatContext.rogueCounter % 2 === 0) {
          effectValue *= 2;
        }
      }
      this.trackCardUsed(card);
      if (card.consumeUse) card.consumeUse();
      // Cycle ATK/DEF cards out of hand after use
      if (card.type !== CARD_TYPES.SKILL) {
        this.cycleCard(card);
      }
      const hpBefore = this.enemy.hp;
      const cardResult = card.apply(this.player, this.enemy, effectValue, this.combatContext);
      if (hpBefore > this.enemy.hp) {
        this.enemySprite.play(`${this.enemyKey}_Hurt`);

        this.enemySprite.once('animationcomplete', () => {
          this.enemySprite.play(`${this.enemyKey}_Idle`);
        });
      }
      this.totalDamageDealt += Math.max(0, hpBefore - this.enemy.hp);
      this.messageText.setText(`Clear Mind! ${cardResult.message}`);
      if (card.type === CARD_TYPES.DEFENSE) {
        this.activeDefense = cardResult.defense !== undefined ? cardResult.defense : effectValue;
      }
      this.updateHP();
      if (CombatSystem.checkWin(this.enemy)) { this.handleWin(); return; }
      this.time.delayedCall(1200, () => { this.doEnemyTurn(); });
      return;
    }

    // Attack / Defense cards: generate a math problem and start the timer
    this.combatState = CombatSystem.COMBAT_STATE.MATH_PROBLEM;
    this.updatePauseAvailability();

    // Lock all cards — no switching allowed once problem is shown
    this.cardObjects.forEach((obj) => obj.disableInteractive());

    this.currentProblem = MathSystem.generate(this.worldLevel, this.nodeIndex, this.player.mathDifficultyOffset || 0, this.battleNumber);
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

    // realElapsed = actual time the player took (used for analytics logging)
    // adjustedElapsed = realElapsed minus FreezeTime bonus (used for timer multiplier)
    const realElapsed = Date.now() - this.timerStartTime;
    const adjustedElapsed = realElapsed + this.combatContext.timerReduction;

    const result = CombatSystem.evaluatePlayerAction(
      this.selectedCard, this.currentProblem, this.inputText,
      Math.max(0, adjustedElapsed), this.timerDuration
    );

    // Apply double power skill bonus before any other modifiers
    let effectValue = result.effect;
    if (this.combatContext.doublePower) {
      effectValue *= 2;
      this.combatContext.doublePower = false;
    }
    // Apply Slime cardEffectivenessModifier (rounds down)
    // Pierce attacks ignore the debuff
    if (this.selectedCard.special !== 'pierce') {
      effectValue = Math.round(effectValue * this.combatContext.cardEffectivenessModifier);
    }
    // Backend tracking — log REAL elapsed (not freeze-adjusted) for honest analytics
    this.logProblem(result.success, Math.max(0, realElapsed));

    if (result.success) {
      // Rogue passive: every 2nd successful answer doubles the effect
      let rogueMsg = '';
      if (this.player.rogueDouble) {
        this.combatContext.rogueCounter = (this.combatContext.rogueCounter || 0) + 1;
        if (this.combatContext.rogueCounter % 2 === 0) {
          effectValue *= 2;
          rogueMsg = ' (Rogue Double!)';
        }
      }

      this.trackCardUsed(this.selectedCard);
      if (this.selectedCard.consumeUse) this.selectedCard.consumeUse();
      // Cycle ATK/DEF cards out of hand after use (skill cards don't cycle)
      if (this.selectedCard.type !== CARD_TYPES.SKILL) {
        this.cycleCard(this.selectedCard);
      }
      const hpBefore = this.enemy.hp;
      const cardResult = this.selectedCard.apply(this.player, this.enemy, effectValue, this.combatContext);
      if (this.selectedCard.type === CARD_TYPES.ATTACK) {
        this.playerSprite.play(`${this.skinKey}_Attack`);

        this.playerSprite.once('animationcomplete', () => {
          this.playerSprite.play(`${this.skinKey}_Idle`);
        });
      }
      if (hpBefore > this.enemy.hp) {   //AÑADIDO para enemigo
        this.enemySprite.play(`${this.enemyKey}_Hurt`);
        this.enemySprite.once('animationcomplete', () => {
          this.enemySprite.play(`${this.enemyKey}_Idle`);
        });
      }
      this.totalDamageDealt += Math.max(0, hpBefore - this.enemy.hp);
      this.messageText.setText(`Correct!${rogueMsg} ${cardResult.message}`);

      // Store defense value so enemy attack this turn can be reduced
      if (this.selectedCard.type === CARD_TYPES.DEFENSE) {
        this.activeDefense = cardResult.defense !== undefined ? cardResult.defense : effectValue;
      }

      // Unlock any CardThief-locked card (lock persists until a correct answer)
      this.combatContext.lockedCard = null;
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
    this.combatContext.timerReduction = 0;

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

    // Reset Spider's disable flag BEFORE enemy acts — it only lasts 1 player turn.
    // CardThief's lockedCard is NOT reset here: it persists until the player
    // answers a math problem correctly (handled in submitAnswer).
    this.combatContext.disabledCard = null;

    // Bleed tick — apply DoT damage to enemy at the start of its turn
    let bleedMsg = '';
    if (this.enemy.bleed && this.enemy.bleed > 0) {
      const tickDmg = this.enemy.bleedDamage || 0;
      this.enemy.takeDamage(tickDmg);
      this.enemy.bleed -= 1;
      bleedMsg = `${this.enemy.name} bleeds for ${tickDmg} damage!\n`;
      this.updateHP();
      // If bleed killed the enemy, end combat right here
      if (CombatSystem.checkWin(this.enemy)) {
        this.messageText.setText(bleedMsg.trim());
        this.handleWin();
        return;
      }
    }

    // Evade card — roll once per enemy turn. Dodges all damage this turn.
    let evaded = false;
    if (this.combatContext.evadeChance > 0 && Math.random() < this.combatContext.evadeChance) {
      evaded = true;
    }
    this.combatContext.evadeChance = 0; // consume regardless

    // Taunt card — 50% chance to force enemy to use a skill this turn
    let action = this.enemy.getAction();
    if (this.combatContext.tauntForceSkill) {
      this.combatContext.tauntForceSkill = false;
      if (Math.random() < 0.5) {
        action = 'skill';
      }
    }

    let msg = bleedMsg;

    if (action === 'skill') {
      // Enemy uses its unique skill — may mutate combatContext
      const skillResult = this.enemy.useSkill(this.player, this.combatContext);
      msg = bleedMsg + (skillResult ? skillResult.message : '');

      // Skill enemies also attack unless the skill flagged a skip (Titan charging)
      if (!this.combatContext.enemySkipAttack) {
        this.enemySprite.play(`${this.enemyKey}_Attack`);
        this.enemySprite.once('animationcomplete', () => {
          this.enemySprite.play(`${this.enemyKey}_Idle`);
        });

        let damage = this.enemy.attackPower;
        damage = Math.round(damage * this.combatContext.enemyDamageBoost);
        if (evaded) {
          msg += `\n${this.player.name} evades the attack!`;
        } else {
          CombatSystem.enemyTurn(this.enemy, this.player, this.activeDefense);
          msg += `\n${this.enemy.name} attacks for ${damage} damage!`;
        }
      }
  
      if (!evaded) {
        this.playerSprite.play(`${this.skinKey}_Hurt`);

        this.playerSprite.once('animationcomplete', () => {
          this.playerSprite.play(`${this.skinKey}_Idle`);
        });
      }
    } else {
      this.enemySprite.play(`${this.enemyKey}_Attack`);
      this.enemySprite.once('animationcomplete', () => {
        this.enemySprite.play(`${this.enemyKey}_Idle`);
      });
      // Standard attack — spread a modified clone to pass boosted damage cleanly
      let damage = this.enemy.attackPower;
      damage = Math.round(damage * this.combatContext.enemyDamageBoost);
      if (evaded) {
        msg = bleedMsg + `${this.enemy.name} attacks but ${this.player.name} evades!`;
      } else {
        CombatSystem.enemyTurn(
          { ...this.enemy, attackPower: damage },
          this.player,
          this.activeDefense
        );
        if (damage > this.activeDefense) {                    //testing
          this.playerSprite.play(`${this.skinKey}_Hurt`);

          this.playerSprite.once('animationcomplete', () => {
            this.playerSprite.play(`${this.skinKey}_Idle`);
          });
        }
        msg = bleedMsg + `${this.enemy.name} attacks for ${damage} damage!`;
        if (this.activeDefense > 0) {
          msg += ` (Blocked ${this.activeDefense})`;
        }
      }
    }

    // VampireKing double action — also blocked by evade
    if (this.combatContext.enemyDoubleAction) {
      const bonusDmg = this.enemy.attackPower;
      if (!evaded) {
        this.player.takeDamage(bonusDmg);
        msg += `\nDouble action! Extra ${bonusDmg} damage!`;
      } else {
        msg += `\nDouble action evaded!`;
      }
      this.combatContext.enemyDoubleAction = false;
    }

    // Reset turn-scoped context flags
    this.combatContext.enemyDamageBoost = 1;
    this.combatContext.enemySkipAttack = false;
    // Barrier card — keep activeDefense for one extra enemy turn
    if (this.combatContext.barrierTurns > 0) {
      this.combatContext.barrierTurns -= 1;
    } else {
      this.activeDefense = 0;
    }

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

  // ============================================================
  // Card cycling (ATK/DEF cards rotate through hand)
  // ============================================================

  /**
   * Builds the visible deck: current hand (ATK/DEF) + equipped skill card.
   * Called when hand composition changes (after cycling).
   */
  buildVisibleDeck() {
    const activeSkill = this.player.selectedSkill ? [this.player.selectedSkill] : [];
    return [...this.cardHand, ...activeSkill];
  }

  /**
   * Cycles a used ATK/DEF card out of the hand:
   *   1. Remove from hand → push to usedPile
   *   2. If queue has cards → pull next into hand
   *   3. If queue empty → recycle usedPile into queue → pull next
   * Updates combatContext.playerDeck to reflect the new hand.
   */
  cycleCard(card) {
    const idx = this.cardHand.indexOf(card);
    if (idx >= 0) this.cardHand.splice(idx, 1);
    this.usedPile.push(card);

    // Refill hand from queue; recycle usedPile if queue is exhausted
    if (this.cardQueue.length === 0 && this.usedPile.length > 0) {
      this.cardQueue = [...this.usedPile];
      this.usedPile = [];
    }
    if (this.cardQueue.length > 0) {
      this.cardHand.push(this.cardQueue.shift());
    }

    // Update visible deck for drawCards
    this.combatContext.playerDeck = this.buildVisibleDeck();
  }

  /**
   * Called when the math problem timer runs out.
   * Forces the player's turn to end without accepting any answer.
   * SecondChance still applies — gives one retry on timeout.
   */
  handleTimeout() {
    // SecondChance: one free retry on timeout
    if (this.combatContext.secondChance) {
      this.combatContext.secondChance = false;
      this.messageText.setText('Time out! Second Chance — try again!');
      this.inputText = '';
      this.inputDisplay.setText('_');
      this.inputBg.setVisible(true);
      this.inputDisplay.setVisible(true);
      this.timerStartTime = Date.now();
      this.timerBarFill.setVisible(true);
      this.timerActive = true;
      return;
    }

    // Backend tracking — log this problem as timed out / incorrect
    this.logProblem(false, this.timerDuration);

    // Flip state OUT of MATH_PROBLEM so keyboard input is ignored
    this.combatState = CombatSystem.COMBAT_STATE.EVALUATE;
    this.messageText.setText('Time out! No effect.');

    // Reset per-turn modifiers
    this.combatContext.cardEffectivenessModifier = 1;
    this.combatContext.timerReduction = 0;

    // Hide input / timer UI
    this.inputBg.setVisible(false);
    this.inputDisplay.setVisible(false);
    this.timerBarFill.setVisible(false);
    this.problemText.setText('');

    this.time.delayedCall(1200, () => {
      this.doEnemyTurn();
    });
  }

  /**
   * Resets state for the next turn: clears card objects and redraws the hand.
   */
  startNewTurn() {
    this.combatState = CombatSystem.COMBAT_STATE.SELECT_CARD;
    this.updatePauseAvailability();
    this.problemText.setText('Select a card');
    this.messageText.setText('');
    this.selectedCard = null;
    this.turnCount += 1;

    // Regen card — apply HoT tick at the start of each new player turn
    if (this.combatContext.playerRegen > 0) {
      const amount = this.combatContext.playerRegenAmount || 0;
      this.player.heal(amount);
      this.combatContext.playerRegen -= 1;
      this.messageText.setText(`Regenerated ${amount} HP! (${this.combatContext.playerRegen} turns left)`);
      this.updateHP();
    }

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
    this.disableForfeit();

    // Mark the current map node as completed so MapScene renders it correctly
    const map = this.registry.get('currentMap');
    if (map) {
      const node = map.nodes[map.currentNode];
      if (node) node.completed = true;
    }

    // Backend tracking — log combat win + bump run.enemies_defeated.
    // If this was a boss kill, also mark run as won.
    this.logCombatResult('win');
    // Boss win = run completes → drop any pending save
    if (this.isBoss && this.registry.get('authMode') === 'online') {
      const runID = this.registry.get('runID');
      if (runID) deleteRunSave(runID);
    }
    const newDefeated = (this.registry.get('runEnemiesDefeated') || 0) + 1;
    this.registry.set('runEnemiesDefeated', newDefeated);
    const runID = this.registry.get('runID');
    if (runID) {
      const fields = { enemies_defeated: newDefeated };
      if (this.isBoss) {
        fields.result = 'win';
        fields.duration = this.computeRunDuration();
      }
      updateRun(runID, fields);
    }

    this.enemySprite.play(`${this.enemyKey}_Death`);
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

  /**
   * Called when the player reaches 0 HP.
   * Strips the normal deck (keeps skill cards), clears the map, returns to HomeScene.
   */
  handleLose() {
    this.combatState = CombatSystem.COMBAT_STATE.LOSE;
    this.disableForfeit();

    // Backend tracking — log combat loss + close out the Run + wipe collection
    this.logCombatResult('lose');
    const runID = this.registry.get('runID');
    if (runID) {
      updateRun(runID, {
        result: 'lose',
        duration: this.computeRunDuration(),
      });
    }
    // Delete any pending save slot (run is over). Collection NOT wiped here —
    // wipe only happens via Options menu.
    if (this.registry.get('authMode') === 'online') {
      const runID = this.registry.get('runID');
      if (runID) deleteRunSave(runID);
    }

    this.messageText.setText('DEFEAT...');
    this.playerSprite.play(`${this.skinKey}_Death`);
    this.problemText.setText('You have been defeated!').setColor('#ff4444');

    this.time.delayedCall(2500, () => {
      this.player.onDefeat();              // HP/level reset, cards preserved
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
    const ratio = TimerSystem.getRatio(elapsed, this.timerDuration);
    const color = TimerSystem.getZoneColor(elapsed, this.timerDuration);

    // Scale bar width and update color to reflect current time zone
    this.timerBarFill.setDisplaySize(ratio * 500, 18);
    this.timerBarFill.setFillStyle(color);

    // Timeout: force end of player turn — no answer accepted, no card effect
    if (TimerSystem.isExpired(elapsed, this.timerDuration)) {
      this.timerActive = false;
      this.handleTimeout();
    }
  }

  /**
   * Starts a trap challenge: skips card selection and immediately presents a math problem.
   * Used when a TRAP chest rolls the math-challenge outcome (no enemy combat).
   * Solving correctly lets the player escape; timeout/wrong = no penalty (node already marked complete).
   */
  startTrapChallenge() {
    this.combatState = CombatSystem.COMBAT_STATE.MATH_PROBLEM;
    this.currentProblem = MathSystem.generate(this.worldLevel, this.nodeIndex, this.player.mathDifficultyOffset || 0, this.battleNumber);
    this.problemText.setText(`TRAP! Solve: ${this.currentProblem.text} = ?`);
    this.inputText = '';
    this.inputBg.setVisible(true);
    this.inputDisplay.setVisible(true).setText('_');
    this.timerStartTime = Date.now();
    this.timerBarFill.setVisible(true);
    this.timerActive = true;
    this.messageText.setText('Solve the problem to escape the trap!');
  }

  // ============================================================
  // Backend tracking helpers
  // ============================================================

  /**
   * Records a played card into the per-combat tracking array.
   * Looks up the DB cardID by name from the cached catalog.
   */
  trackCardUsed(card) {
    const cardID = getCardIDByName(card.name);
    if (cardID) {
      this.cardsUsedThisCombat.push({ cardID, turn_number: this.turnCount });
    }
  }

  /**
   * Sends a POST /api/problem with the current problem context.
   * Fire-and-forget — never blocks combat.
   */
  async logProblem(isCorrect, elapsedMs) {
    if (this.registry.get('authMode') !== 'online') return;
    const runID = this.registry.get('runID');
    if (!runID || !this.currentProblem) return;

    const playerAnswer = parseInt(this.inputText, 10);
    const res = await postProblem({
      runID,
      world_level: this.worldLevel,
      battle_number: this.battleNumber || 1,
      difficulty: `tier_${this.battleNumber || 1}`,
      op_type: this.currentProblem.operation,
      expression: this.currentProblem.text,
      answer: this.currentProblem.answer,
      player_answer: isNaN(playerAnswer) ? null : playerAnswer,
      response_time: Math.round(elapsedMs),
      is_correct: !!isCorrect,
    });
    if (res.ok) {
      this.lastProblemID = res.data.problemID;
    }
  }

  /**
   * Sends a POST /api/combat at the end of the encounter.
   * Includes all cards used and the linked last problem.
   */
  async logCombatResult(combatResult) {
    if (this.registry.get('authMode') !== 'online') return;
    const runID = this.registry.get('runID');
    if (!runID) return;

    const enemyID = getEnemyIDByName(this.enemy.name);
    if (!enemyID) return;

    // Derive timer zone from last problem performance — fallback to 'green' on win, 'timeout' on lose
    const timer_result = combatResult === 'win' ? 'green' : 'timeout';

    await postCombat({
      runID,
      enemyID,
      problemID: this.lastProblemID,
      timer_result,
      damage_dealt: Math.round(this.totalDamageDealt),
      combat_result: combatResult,
      cards_used: this.cardsUsedThisCombat,
    });
  }

  /**
   * Returns seconds elapsed since the run started (clamped to 0).
   */
  computeRunDuration() {
    const start = this.registry.get('runStartTime');
    if (!start) return 0;
    return Math.max(0, Math.round((Date.now() - start) / 1000));
  }

  /**
   * Forfeit handler — same effect as a defeat: marks run lose, wipes deck,
   * keeps skill cards, returns to LevelSelectScene via drawBackButton navigation.
   * Guards against firing after combat already resolved (win/lose) to avoid
   * overwriting a victory with a forfeit loss.
   */
  forfeitCombat() {
    if (this.combatState === CombatSystem.COMBAT_STATE.WIN ||
      this.combatState === CombatSystem.COMBAT_STATE.LOSE) {
      return;
    }
    const player = this.registry.get('player');
    if (player) player.onDefeat();
    this.registry.set('currentMap', null);
    this.combatState = CombatSystem.COMBAT_STATE.LOSE;
    this.timerActive = false;

    if (this.registry.get('authMode') === 'online') {
      const runID = this.registry.get('runID');
      if (runID) {
        updateRun(runID, { result: 'lose', duration: this.computeRunDuration() });
      }
      // Collection NOT wiped — preserved unless user clicks Options wipe button.
    }
  }

  /**
   * Disables the FORFEIT button so it can't fire after combat resolves.
   */
  disableForfeit() {
    if (this.forfeitButton?.bg) {
      this.forfeitButton.bg.disableInteractive();
      this.forfeitButton.bg.setFillStyle(0x333333, 0.5);
      this.forfeitButton.text.setColor('#666666');
    }
  }

  // ============================================================
  // Pause + save
  // ============================================================

  /**
   * Draws the pause button (bottom-left). Refuses to fire if the player is
   * in the middle of a math problem or any non-SELECT_CARD state.
   */
  drawPauseButton() {
    const x = 60, y = 580;
    const bg = this.add.rectangle(x, y, 100, 30, 0x4466aa, 0.9)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0xffffff)
      .setDepth(1000);
    const text = this.add.text(x, y, '|| PAUSE', {
      fontSize: '13px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5).setDepth(1000);

    bg.on('pointerover', () => bg.setFillStyle(0x6688cc, 1));
    bg.on('pointerout', () => bg.setFillStyle(0x4466aa, 0.9));
    bg.on('pointerdown', () => this.tryPause());
    return { bg, text };
  }

  /**
   * Updates pause button appearance based on combatState.
   * Pause only allowed during SELECT_CARD (not mid-problem, not enemy turn).
   */
  updatePauseAvailability() {
    if (!this.pauseButton) return;
    const available = this.combatState === CombatSystem.COMBAT_STATE.SELECT_CARD;
    this.pauseButton.bg.setFillStyle(available ? 0x4466aa : 0x333333, available ? 0.9 : 0.5);
    this.pauseButton.text.setColor(available ? '#ffffff' : '#666666');
  }

  /**
   * Handles pause click — checks state, confirms, saves, navigates away.
   */
  tryPause() {
    if (this.combatState !== CombatSystem.COMBAT_STATE.SELECT_CARD) {
      showToast(this, 'Cannot pause during a math problem', 'warn');
      return;
    }
    if (this.registry.get('authMode') !== 'online') {
      showToast(this, 'Pause requires online mode', 'warn');
      return;
    }
    showConfirmDialog(this,
      'Save progress and quit to menu?\nYou can resume this run from HomeScene > LOAD GAME.',
      () => this.savePauseAndExit()
    );
  }

  /**
   * Builds a state snapshot, PUTs it to /run/:id/save, navigates to HomeScene.
   * The combat itself is discarded — on resume the player returns to MapScene
   * at their current node and re-enters this fight.
   */
  async savePauseAndExit() {
    const runID = this.registry.get('runID');
    if (!runID) {
      showToast(this, 'No active run to save', 'error');
      return;
    }
    const player = this.registry.get('player');
    const map = this.registry.get('currentMap');

    const state = {
      world_level: this.worldLevel,
      enemies_defeated: this.registry.get('runEnemiesDefeated') || 0,
      duration_so_far: this.computeRunDuration(),
      player: player ? {
        hp: player.hp,
        maxHp: player.maxHp,
        level: player.level,
        skinIndex: player.skinIndex,
      } : null,
      map: map ? {
        currentNode: map.currentNode,
        completedNodes: map.nodes.filter((n) => n.completed).map((n) => n.id),
      } : null,
      // Full combat snapshot — re-enter the SAME fight on resume.
      combat: {
        enemyName: this.enemy.name,
        enemyHp: this.enemy.hp,
        enemyMaxHp: this.enemy.maxHp,
        enemyBleed: this.enemy.bleed || 0,
        enemyBleedDmg: this.enemy.bleedDamage || 0,
        isBoss: this.isBoss,
        nodeIndex: this.nodeIndex,
        battleNumber: this.battleNumber,
        turnCount: this.turnCount,
        activeDefense: this.activeDefense,
        totalDamageDealt: this.totalDamageDealt,
        combatContext: {
          cardEffectivenessModifier: this.combatContext.cardEffectivenessModifier,
          enemyDamageBoost: this.combatContext.enemyDamageBoost,
          timerReduction: this.combatContext.timerReduction,
          enemyDoubleAction: this.combatContext.enemyDoubleAction,
          enemySkipAttack: this.combatContext.enemySkipAttack,
          disabledCard: null,  // card refs can't serialize; reset on restore
          lockedCard: null,
          secondChance: this.combatContext.secondChance,
          clearMind: this.combatContext.clearMind,
          doublePower: this.combatContext.doublePower,
          rogueCounter: this.combatContext.rogueCounter,
          playerRegen: this.combatContext.playerRegen,
          playerRegenAmount: this.combatContext.playerRegenAmount,
          tauntForceSkill: this.combatContext.tauntForceSkill,
          evadeChance: this.combatContext.evadeChance,
          barrierTurns: this.combatContext.barrierTurns,
        },
      },
    };

    const res = await saveRun(runID, state);
    if (!res.ok) {
      showToast(this, `Save failed: ${res.error}`, 'error');
      return;
    }
    // Stop timer so it doesn't fire mid-transition
    this.timerActive = false;
    this.scene.start('HomeScene');
  }

  /**
   * Restores combat state from a saved snapshot (from SavedGamesScene resume).
   * Overrides enemy HP, combatContext flags, turn counter, etc.
   */
  applyCombatRestore(snap) {
    // Enemy state
    if (this.enemy) {
      this.enemy.hp = snap.enemyHp;
      this.enemy.maxHp = snap.enemyMaxHp || this.enemy.maxHp;
      if (snap.enemyBleed) {
        this.enemy.bleed = snap.enemyBleed;
        this.enemy.bleedDamage = snap.enemyBleedDmg;
      }
    }
    // Combat-scoped scalars
    this.activeDefense = snap.activeDefense || 0;
    this.turnCount = snap.turnCount || 1;
    this.totalDamageDealt = snap.totalDamageDealt || 0;

    // Merge restored combatContext into the freshly-built one
    if (snap.combatContext) {
      Object.assign(this.combatContext, snap.combatContext);
    }
  }
}