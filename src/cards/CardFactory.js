/**
 * CardFactory.js
 * Centralized factory for creating cards at specific moments in the game.
 * Used by DeckBuildScene (starter deck), RewardScene (post-combat reward),
 * and RewardScene (boss reward → skill card).
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import { getRandomAttackCard, ATTACK_CARDS } from './AttackCard.js';
import { getRandomDefenseCard, DEFENSE_CARDS } from './DefenseCard.js';
import { getRandomSkillCard } from './SkillCard.js';

/**
 * Returns a random card from the given pool that is NOT already owned
 * (checked by name against ownedNames set). Falls back to a fresh random
 * if all cards in the pool are already owned.
 * @param {Function[]} pool  - Array of card factory functions
 * @param {Set<string>} ownedNames
 * @returns {BaseCard}
 */
function pickUnique(pool, ownedNames) {
  // Build list of factories for cards not yet owned
  const available = pool.filter((factory) => {
    const sample = factory();
    return !ownedNames.has(sample.name);
  });
  const source = available.length > 0 ? available : pool; // fallback if all owned
  const factory = source[Math.floor(Math.random() * source.length)];
  return factory();
}

/**
 * Creates the initial deck for a new run.
 * 2 attack + 2 defense, no duplicates within the starter deck.
 * @param {number} worldLevel
 * @returns {BaseCard[]}
 */
function createStarterDeck(worldLevel = 1) {
  const atkPool = ATTACK_CARDS[worldLevel] || ATTACK_CARDS[1];
  const defPool = DEFENSE_CARDS[worldLevel] || DEFENSE_CARDS[1];
  const owned   = new Set();

  const pick = (pool) => {
    const card = pickUnique(pool, owned);
    owned.add(card.name);
    return card;
  };

  // Always include the heal defense card as first defense card (index 2 = 'heal')
  const healCard = defPool[2]?.() || defPool[0]();
  owned.add(healCard.name);

  const atk1 = pick(atkPool);
  const atk2 = pick(atkPool);

  // Second defense card — unique vs healCard
  const def2 = pickUnique(defPool, owned);

  return [atk1, atk2, healCard, def2];
}

/**
 * Creates a single reward card, excluding cards already owned by the player.
 * 50% attack / 50% defense. Falls back to random if all cards are owned.
 * @param {number} worldLevel
 * @param {string[]} [ownedNames]  - Names of cards already in collection
 * @returns {BaseCard}
 */
function createRewardCard(worldLevel = 1, ownedNames = []) {
  const owned   = new Set(ownedNames);
  const atkPool = ATTACK_CARDS[worldLevel] || ATTACK_CARDS[1];
  const defPool = DEFENSE_CARDS[worldLevel] || DEFENSE_CARDS[1];

  if (Math.random() < 0.5) {
    return pickUnique(atkPool, owned);
  }
  return pickUnique(defPool, owned);
}

/**
 * Creates a skill card reward granted when the player defeats a boss.
 * @returns {BaseCard}
 */
function createBossReward() {
  return getRandomSkillCard();
}

export default { createStarterDeck, createRewardCard, createBossReward };
