-- ============================================================
--  Math Smash: Card Adventure -- Database Schema V3
--  MySQL 8.0+
--  Fixes all critical bugs from V2 + aligns with current game flow
-- ============================================================

CREATE DATABASE IF NOT EXISTS mathsmash CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mathsmash;

-- ------------------------------------------------------------
-- PLAYER: account data. password stores bcrypt hash, never plaintext.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Player (
  playerID    INT          NOT NULL AUTO_INCREMENT,
  username    VARCHAR(50)  NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,           -- bcrypt hash
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (playerID)
);

-- ------------------------------------------------------------
-- MAP: world metadata (Ancient Temple, Castle, Wasteland).
-- Re-added since worlds need names/themes for UI.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Map (
  mapID        INT          NOT NULL AUTO_INCREMENT,
  name         VARCHAR(100) NOT NULL,           -- e.g. 'Ancient Temple'
  theme        VARCHAR(100),
  world_level  TINYINT      NOT NULL UNIQUE,    -- 1, 2, or 3
  PRIMARY KEY (mapID)
);

-- ------------------------------------------------------------
-- RUN: one play session (replaces Game from V1).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Run (
  runID             INT      NOT NULL AUTO_INCREMENT,
  playerID          INT      NOT NULL,
  world_level       TINYINT  NOT NULL,                -- 1, 2, or 3 (renamed from `level`)
  skin_selected     TINYINT  NOT NULL DEFAULT 0,      -- 0=Warrior 1=Mage 2=Rogue
  start_date        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  duration          INT      NOT NULL DEFAULT 0,      -- seconds elapsed
  enemies_defeated  INT      NOT NULL DEFAULT 0,
  result            ENUM('win','lose','ongoing') NOT NULL DEFAULT 'ongoing',
  PRIMARY KEY (runID),
  FOREIGN KEY (playerID) REFERENCES Player(playerID) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- ENEMY: per-world enemy catalog. Same enemy can appear in
-- multiple map nodes of the same world.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Enemy (
  enemyID       INT          NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100) NOT NULL,
  type          ENUM('basic','trap','boss') NOT NULL DEFAULT 'basic',
  world_level   TINYINT      NOT NULL,
  hp            INT          NOT NULL,
  attack_power  INT          NOT NULL,
  skill_name    VARCHAR(100),
  skill_desc    VARCHAR(255),
  PRIMARY KEY (enemyID)
);

-- ------------------------------------------------------------
-- CARD: catalog of all attack/defense/skill cards.
-- `special` field needed to differentiate mechanics:
--   attack:  none|lifesteal|reckless|pierce|crit|bleed
--   defense: none|heal|counter|reflect|regen|taunt|evade|barrier
--   skill:   none (skill cards use class identity for behavior)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Card (
  cardID       INT          NOT NULL AUTO_INCREMENT,
  name         VARCHAR(100) NOT NULL,
  type         ENUM('attack','defense','skill') NOT NULL,
  world_level  TINYINT      NOT NULL DEFAULT 1,
  description  VARCHAR(255),
  power_value  INT          NOT NULL DEFAULT 0,
  special      VARCHAR(50)  NOT NULL DEFAULT 'none',
  PRIMARY KEY (cardID)
);

-- ------------------------------------------------------------
-- DECK: one deck row per player (their card collection).
-- Card membership is tracked in DeckCard (junction).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Deck (
  deckID        INT      NOT NULL AUTO_INCREMENT,
  playerID      INT      NOT NULL,
  creation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_modified DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                         ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (deckID),
  FOREIGN KEY (playerID) REFERENCES Player(playerID) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- DECK_CARD (junction: Deck <-> Card, M:M).
-- is_active TRUE  = card is in the active 4-card combat deck
-- is_active FALSE = card is owned but not selected
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS DeckCard (
  deckID    INT     NOT NULL,
  cardID    INT     NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (deckID, cardID),
  FOREIGN KEY (deckID) REFERENCES Deck(deckID) ON DELETE CASCADE,
  FOREIGN KEY (cardID) REFERENCES Card(cardID)
);

-- ------------------------------------------------------------
-- SKILL_DECK: skill cards persist across defeats (roguelike).
-- Stored separately so onDefeat() can clear Deck but keep this.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS SkillDeck (
  skillDeckID  INT     NOT NULL AUTO_INCREMENT,
  playerID     INT     NOT NULL,
  cardID       INT     NOT NULL,
  is_equipped  BOOLEAN NOT NULL DEFAULT FALSE,   -- player can equip max 1 at a time
  unlocked_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (skillDeckID),
  UNIQUE KEY uniq_player_skill (playerID, cardID),  -- no duplicate skill cards
  FOREIGN KEY (playerID) REFERENCES Player(playerID) ON DELETE CASCADE,
  FOREIGN KEY (cardID)   REFERENCES Card(cardID)
);

-- ------------------------------------------------------------
-- PROBLEM_STATS: every math problem the player faces.
-- expression + answer stored to allow analytics/auditing.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ProblemStats (
  problemID      INT          NOT NULL AUTO_INCREMENT,
  runID          INT          NOT NULL,
  world_level    TINYINT      NOT NULL,                  -- 1, 2, or 3
  battle_number  TINYINT      NOT NULL DEFAULT 1,        -- which battle in the run (1-5)
  difficulty     VARCHAR(50)  NOT NULL,                  -- 'tier_1', 'tier_2', etc.
  op_type        VARCHAR(50)  NOT NULL,                  -- 'addition','multiplication','mixed', etc.
  expression     VARCHAR(100) NOT NULL,                  -- e.g. '25 + 50 x 6'
  answer         INT          NOT NULL,                  -- correct answer
  player_answer  INT,                                    -- what the player typed (nullable on timeout)
  response_time  INT          NOT NULL DEFAULT 0,        -- ms elapsed when submitted
  is_correct     BOOLEAN      NOT NULL DEFAULT FALSE,
  PRIMARY KEY (problemID),
  FOREIGN KEY (runID) REFERENCES Run(runID) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- COMBAT: one row per combat encounter (battle, trap enemy, boss).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Combat (
  combatID       INT          NOT NULL AUTO_INCREMENT,
  runID          INT          NOT NULL,
  enemyID        INT          NOT NULL,
  problemID      INT,                                    -- nullable; some combats have multiple problems
  timer_result   ENUM('green','yellow','red','timeout') NOT NULL DEFAULT 'timeout',
  damage_dealt   INT          NOT NULL DEFAULT 0,
  combat_result  ENUM('win','lose','ongoing') NOT NULL DEFAULT 'ongoing',
  played_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (combatID),
  FOREIGN KEY (runID)     REFERENCES Run(runID) ON DELETE CASCADE,
  FOREIGN KEY (enemyID)   REFERENCES Enemy(enemyID),
  FOREIGN KEY (problemID) REFERENCES ProblemStats(problemID)
);

-- ------------------------------------------------------------
-- CARDS_USED: junction tracking which cards were played in a combat.
-- Composite PK avoids the AUTO_INCREMENT issue from V2.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS CardsUsed (
  combatID    INT     NOT NULL,
  cardID      INT     NOT NULL,
  turn_number TINYINT NOT NULL DEFAULT 1,              -- which turn the card was played
  PRIMARY KEY (combatID, cardID, turn_number),
  FOREIGN KEY (combatID) REFERENCES Combat(combatID) ON DELETE CASCADE,
  FOREIGN KEY (cardID)   REFERENCES Card(cardID)
);

-- ------------------------------------------------------------
-- PLAYER_STATS: aggregated stats per player per world.
-- One row per (playerID, world_number) pair.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS PlayerStats (
  playerStatsID        INT         NOT NULL AUTO_INCREMENT,
  playerID             INT         NOT NULL,
  world_number         TINYINT     NOT NULL,                  -- 1, 2, or 3
  difficulty_progress  VARCHAR(50) NOT NULL DEFAULT 'tier_1', -- highest tier reached
  enemies_defeated     INT         NOT NULL DEFAULT 0,
  problems_solved      INT         NOT NULL DEFAULT 0,
  average_speed        FLOAT       NOT NULL DEFAULT 0,        -- avg response time (ms)
  time_played          FLOAT       NOT NULL DEFAULT 0,        -- total seconds
  PRIMARY KEY (playerStatsID),
  UNIQUE KEY uniq_player_world (playerID, world_number),
  FOREIGN KEY (playerID) REFERENCES Player(playerID) ON DELETE CASCADE
);

-- AI tool used for code commenting: Claude (Anthropic)
