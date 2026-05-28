-- ============================================================
--  Math Smash: Card Adventure -- Database Schema
--  MySQL 8.0+
-- ============================================================
-- node, npm, mysql2
-- ============================================================
-- MODIFIED VERSION BASED ON NEW DIAGRAM

CREATE DATABASE IF NOT EXISTS mathsmash CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mathsmash;

-- ------------------------------------------------------------
-- PLAYER: Stores account data. 
-- ------------------------------------------------------------
CREATE TABLE Player (
  playerID		INT				NOT NULL AUTO_INCREMENT,
  username		VARCHAR(50)		NOT NULL UNIQUE,	-- no permite valores repetidos
  password		VARCHAR(255)	NOT NULL,
  created_at	DATETIME		NOT NULL DEFAULT CURRENT_TIMESTAMP, -- guarda fecha y hora
  PRIMARY KEY (playerID)
);

-- ------------------------------------------------------------
-- RUN: Stores data for the player's general play. 
-- ------------------------------------------------------------
CREATE TABLE Run (
  runID				INT			NOT NULL AUTO_INCREMENT,
  playerID			INT			NOT NULL,
  level				INT			NOT NULL,
  start_date		DATETIME	NOT NULL DEFAULT CURRENT_TIMESTAMP,
  duration			INT			NOT NULL DEFAULT 0,
  result_record		INT			NOT NULL DEFAULT 0,
  enemies_defeated	INT 		NOT NULL DEFAULT 0, 
  skin_selected 	INT			NOT NULL,
  PRIMARY KEY (runID),
  FOREIGN KEY (playerID)   REFERENCES Player(playerID)
);

-- ------------------------------------------------------------
-- ENEMY: Stores basic elements.
-- ------------------------------------------------------------
CREATE TABLE Enemy (
  enemyID		INT				NOT NULL AUTO_INCREMENT,
  name			VARCHAR(100)	NOT NULL,
  type			ENUM('basic','trap','boss') NOT NULL DEFAULT 'basic',
  world_level	INT				NOT NULL,
  hp			INT				NOT NULL,
  attack_power	INT				NOT NULL,
  skill_name	VARCHAR(100),
  PRIMARY KEY (enemyID)
);

-- ------------------------------------------------------------
-- PLAYER STATS: important data for displaying statiistics
-- ------------------------------------------------------------
CREATE TABLE PlayerStats (
  playerStatsID			INT		NOT NULL,
  playerID				INT		NOT NULL,
  world_number			INT		NOT NULL,
  difficulty_progress	VARCHAR(50) NOT NULL,
  enemies_defeated		INT		NOT NULL,
  problems_solved		INT		NOT NULL,
  average_speed			FLOAT 	NOT NULL,
  time_played			FLOAT 	NOT NULL,
  PRIMARY KEY (cardID)
);

-- ------------------------------------------------------------
-- SKILL DECK: to save them after lossing
-- ------------------------------------------------------------
CREATE TABLE SkillDeck (
  skillCard_unlock		INT		NOT NULL, 
  PRIMARY KEY (skillCard_unlock),
  FOREIGN KEY (playerID)   REFERENCES Player(playerID),
  FOREIGN KEY (cardID)   REFERENCES Card(cardID)
);

-- ------------------------------------------------------------
-- CARD: information of each card
-- ------------------------------------------------------------
CREATE TABLE Card (
  cardID		INT          NOT NULL AUTO_INCREMENT,
  name			VARCHAR(100) NOT NULL,
  type			ENUM('attack','defense','skill') NOT NULL,
  world_level	TINYINT      NOT NULL DEFAULT 1,
  description	VARCHAR(255),
  power_value	INT          NOT NULL DEFAULT 0,
  -- special	VARCHAR(50)  NOT NULL DEFAULT 'none',
  -- effect_type	VARCHAR(50)	NOT NULL,
  PRIMARY KEY (cardID)
);

-- ------------------------------------------------------------
-- DECK: One deck per player (their current collection).
-- ------------------------------------------------------------
CREATE TABLE Deck (
  deckID		INT			NOT NULL	AUTO_INCREMENT,
  playerID		INT			NOT NULL,
  cardID		INT         NOT NULL	AUTO_INCREMENT,
  creation_date	DATETIME	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
  last_modified	DATETIME	NOT NULL	DEFAULT CURRENT_TIMESTAMP
							ON UPDATE	CURRENT_TIMESTAMP,
  PRIMARY KEY (deckID),
  FOREIGN KEY (playerID) REFERENCES Player(playerID), -- ON DELETE CASCADE
  FOREIGN KEY (cardID) REFERENCES Card(cardID) 
);

-- ------------------------------------------------------------
-- PROBLEM STATS: information for tracking specific statistics
-- ------------------------------------------------------------
CREATE TABLE ProblemStats (
  problemID		INT		NOT NULL AUTO_INCREMENT,
  runID			INT		NOT NULL,
  level			INT		NOT NULL,
  difficulty	VARCHAR(50) NOT NULL, 
  op_type		VARCHAR(50)	NOT NULL,
  -- expression
  response_time	TIME	NOT NULL,
  answer_record	INT		NOT NULL,
  PRIMARY KEY (problemID),
  FOREIGN KEY (runID) REFERENCES Run(runID) 
);

-- ------------------------------------------------------------
-- COMBAT: data of every combat the player/chest start
-- ------------------------------------------------------------
CREATE TABLE Combat (
  combatID			INT		NOT NULL AUTO_INCREMENT,
  runID				INT		NOT NULL,
  enemyID			INT		NOT NULL,
  problemID			INT		NOT NULL,
  timer_result		TIME	NOT NULL,
  damage_dealt		INT		NOT NULL DEFAULT 0,
  combat_result		ENUM('win','lose','ongoing')	NOT NULL DEFAULT 'ongoing',
  played_at			DATETIME	NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (combatID)
);

-- ------------------------------------------------------------
-- CARDS USED:
-- ------------------------------------------------------------
CREATE TABLE CardsUsed (
  cardsUsedID	INT		NOT NULL,
  combatID		INT		NOT NULL,
  cardID 		INT		NOT NULL,
  PRIMARY KEY (cardsUsedID),
  FOREIGN KEY (combatID) REFERENCES Combat(combatID), 
  FOREIGN KEY (cardID) REFERENCES Card(cardID)
);
