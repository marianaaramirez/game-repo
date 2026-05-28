-- ============================================================
--  Math Smash: Card Adventure -- Database Schema
--  MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS mathsmash CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mathsmash;

-- ------------------------------------------------------------
-- PLAYER
-- Stores account data. password stores a bcrypt hash, never plaintext.
-- ------------------------------------------------------------
CREATE TABLE Player (
  playerID     INT          NOT NULL AUTO_INCREMENT,
  username     VARCHAR(50)  NOT NULL UNIQUE,
  password     VARCHAR(255) NOT NULL,
  skin         TINYINT      NOT NULL DEFAULT 0,
  win_record   INT          NOT NULL DEFAULT 0,
  loss_record  INT          NOT NULL DEFAULT 0,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (playerID)
);

-- ------------------------------------------------------------
-- MAP
-- One row per world template (not per generated instance).
-- world_level replaces math_op_type.
-- ------------------------------------------------------------
CREATE TABLE Map (
  mapID        INT          NOT NULL AUTO_INCREMENT,
  name         VARCHAR(100) NOT NULL,
  theme        VARCHAR(100),
  world_level  TINYINT      NOT NULL,
  PRIMARY KEY (mapID)
);

-- ------------------------------------------------------------
-- GAME
-- One row per play session (player starts a run).
-- ------------------------------------------------------------
CREATE TABLE Game (
  gameID       INT          NOT NULL AUTO_INCREMENT,
  playerID     INT          NOT NULL,
  mapID        INT          NOT NULL,
  start_date   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  duration     INT,
  result       ENUM('win','lose','ongoing') NOT NULL DEFAULT 'ongoing',
  PRIMARY KEY (gameID),
  FOREIGN KEY (playerID) REFERENCES Player(playerID) ON DELETE CASCADE,
  FOREIGN KEY (mapID)    REFERENCES Map(mapID)
);

-- ------------------------------------------------------------
-- ENEMY
-- world_level instead of FK mapID.
-- Same enemy can appear in multiple nodes of the same world.
-- ------------------------------------------------------------
CREATE TABLE Enemy (
  enemyID      INT          NOT NULL AUTO_INCREMENT,
  name         VARCHAR(100) NOT NULL,
  type         ENUM('basic','trap','boss') NOT NULL DEFAULT 'basic',
  world_level  TINYINT      NOT NULL,
  hp           INT          NOT NULL,
  attack_power INT          NOT NULL,
  skill_name   VARCHAR(100),
  skill_desc   VARCHAR(255),
  PRIMARY KEY (enemyID)
);

-- ------------------------------------------------------------
-- CHEST
-- is_trap replaces trap_attack.
-- ------------------------------------------------------------
CREATE TABLE Chest (
  chestID      INT          NOT NULL AUTO_INCREMENT,
  mapID        INT          NOT NULL,
  name         VARCHAR(100),
  is_trap      BOOLEAN      NOT NULL DEFAULT FALSE,
  hp_bonus     INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (chestID),
  FOREIGN KEY (mapID) REFERENCES Map(mapID)
);

-- ------------------------------------------------------------
-- CARD
-- world_level + special added to match game implementation.
-- special: 'none' | 'lifesteal' | 'reckless' | 'heal' | 'counter'
-- ------------------------------------------------------------
CREATE TABLE Card (
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
-- DECK
-- One deck per player (their current collection).
-- ------------------------------------------------------------
CREATE TABLE Deck (
  deckID        INT      NOT NULL AUTO_INCREMENT,
  playerID      INT      NOT NULL,
  creation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_modified DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                         ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (deckID),
  FOREIGN KEY (playerID) REFERENCES Player(playerID) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- COMBAT_DECK  (junction: Deck <-> Card)
-- is_active TRUE  = card in active 4-card deck
-- is_active FALSE = card in collection but not selected
-- ------------------------------------------------------------
CREATE TABLE CombatDeck (
  deckID    INT     NOT NULL,
  cardID    INT     NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (deckID, cardID),
  FOREIGN KEY (deckID) REFERENCES Deck(deckID)  ON DELETE CASCADE,
  FOREIGN KEY (cardID) REFERENCES Card(cardID)
);

-- ------------------------------------------------------------
-- MATH_PROBLEM
-- expression stores full text (e.g. '25 + 50 x 6') to handle
-- 1, 2, or 3 operands without adding extra columns.
-- node_index tracks which map node generated this problem.
-- ------------------------------------------------------------
CREATE TABLE MathProblem (
  problemID      INT          NOT NULL AUTO_INCREMENT,
  gameID         INT          NOT NULL,
  mapID          INT          NOT NULL,
  node_index     TINYINT      NOT NULL DEFAULT 0,
  difficulty     TINYINT      NOT NULL,
  operation_type VARCHAR(50)  NOT NULL,
  expression     VARCHAR(100) NOT NULL,
  answer         INT          NOT NULL,
  PRIMARY KEY (problemID),
  FOREIGN KEY (gameID) REFERENCES Game(gameID) ON DELETE CASCADE,
  FOREIGN KEY (mapID)  REFERENCES Map(mapID)
);

-- ------------------------------------------------------------
-- COMBAT
-- One row per card played in a turn.
-- ------------------------------------------------------------
CREATE TABLE Combat (
  combatID       INT          NOT NULL AUTO_INCREMENT,
  gameID         INT          NOT NULL,
  enemyID        INT          NOT NULL,
  cardID         INT,
  problemID      INT,
  timer_result   ENUM('green','yellow','red','timeout') NOT NULL DEFAULT 'timeout',
  damage_dealt   INT          NOT NULL DEFAULT 0,
  combat_result  ENUM('hit','miss','timeout') NOT NULL DEFAULT 'miss',
  played_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (combatID),
  FOREIGN KEY (gameID)    REFERENCES Game(gameID)        ON DELETE CASCADE,
  FOREIGN KEY (enemyID)   REFERENCES Enemy(enemyID),
  FOREIGN KEY (cardID)    REFERENCES Card(cardID),
  FOREIGN KEY (problemID) REFERENCES MathProblem(problemID)
);
