DROP DATABASE IF EXISTS mathsmash;
CREATE DATABASE mathsmash CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mathsmash;
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS CardsUsed;
DROP TABLE IF EXISTS Combat;
DROP TABLE IF EXISTS ProblemStats;
DROP TABLE IF EXISTS SkillDeck;
DROP TABLE IF EXISTS DeckCard;
DROP TABLE IF EXISTS Deck;
DROP TABLE IF EXISTS Card;
DROP TABLE IF EXISTS Enemy;
DROP TABLE IF EXISTS Run;
DROP TABLE IF EXISTS Map;
DROP TABLE IF EXISTS PlayerStats;
DROP TABLE IF EXISTS Player;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE Player (
  playerID INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (playerID)
) ENGINE=InnoDB;

CREATE TABLE Map (
  mapID INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  theme VARCHAR(100),
  world_level TINYINT NOT NULL,
  PRIMARY KEY (mapID),
  CONSTRAINT chk_map_world CHECK (world_level BETWEEN 1 AND 3)
) ENGINE=InnoDB;

CREATE TABLE Run (
  runID INT NOT NULL AUTO_INCREMENT,
  playerID INT NOT NULL,
  mapID INT,
  world_level TINYINT NOT NULL,
  skin_selected TINYINT NOT NULL DEFAULT 0,
  start_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  duration INT NOT NULL DEFAULT 0,
  enemies_defeated INT NOT NULL DEFAULT 0,
  result ENUM('win','lose','ongoing') NOT NULL DEFAULT 'ongoing',
  PRIMARY KEY (runID),
  INDEX idx_run_player (playerID),
  INDEX idx_run_world (world_level),
  CONSTRAINT chk_run_world CHECK (world_level BETWEEN 1 AND 3),
  CONSTRAINT chk_run_skin CHECK (skin_selected BETWEEN 0 AND 2),
  CONSTRAINT chk_run_duration CHECK (duration >= 0),
  FOREIGN KEY (playerID) REFERENCES Player(playerID) ON DELETE CASCADE,
  FOREIGN KEY (mapID) REFERENCES Map(mapID) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE Enemy (
  enemyID INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  type ENUM('basic','trap','boss') NOT NULL DEFAULT 'basic',
  world_level TINYINT NOT NULL,
  hp INT NOT NULL,
  attack_power INT NOT NULL,
  skill_name VARCHAR(100),
  skill_desc VARCHAR(255),
  PRIMARY KEY (enemyID),
  INDEX idx_enemy_world (world_level),
  CONSTRAINT chk_enemy_world CHECK (world_level BETWEEN 1 AND 3),
  CONSTRAINT chk_enemy_hp CHECK (hp > 0),
  CONSTRAINT chk_enemy_attack CHECK (attack_power >= 0)
) ENGINE=InnoDB;

CREATE TABLE Card (
  cardID INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  type ENUM('attack','defense','skill') NOT NULL,
  world_level TINYINT NOT NULL DEFAULT 1,
  description VARCHAR(255),
  power_value INT NOT NULL DEFAULT 0,
  special VARCHAR(50) NOT NULL DEFAULT 'none',
  PRIMARY KEY (cardID),
  INDEX idx_card_type (type),
  INDEX idx_card_world (world_level),
  CONSTRAINT chk_card_world CHECK (world_level BETWEEN 1 AND 3),
  CONSTRAINT chk_card_power CHECK (power_value >= 0)
) ENGINE=InnoDB;

CREATE TABLE Deck (
  deckID INT NOT NULL AUTO_INCREMENT,
  playerID INT NOT NULL UNIQUE,
  creation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_modified DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (deckID),
  FOREIGN KEY (playerID) REFERENCES Player(playerID) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE DeckCard (
  deckID INT NOT NULL,
  cardID INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (deckID, cardID),
  FOREIGN KEY (deckID) REFERENCES Deck(deckID) ON DELETE CASCADE,
  FOREIGN KEY (cardID) REFERENCES Card(cardID)
) ENGINE=InnoDB;

CREATE TABLE SkillDeck (
  skillDeckID INT NOT NULL AUTO_INCREMENT,
  playerID INT NOT NULL,
  cardID INT NOT NULL,
  is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (skillDeckID),
  UNIQUE KEY uniq_player_skill (playerID, cardID),
  INDEX idx_skilldeck_player (playerID),
  FOREIGN KEY (playerID) REFERENCES Player(playerID) ON DELETE CASCADE,
  FOREIGN KEY (cardID) REFERENCES Card(cardID)
) ENGINE=InnoDB;

CREATE TABLE ProblemStats (
  problemID INT NOT NULL AUTO_INCREMENT,
  runID INT NOT NULL,
  world_level TINYINT NOT NULL,
  battle_number TINYINT NOT NULL DEFAULT 1,
  difficulty VARCHAR(50) NOT NULL,
  op_type VARCHAR(50) NOT NULL,
  expression VARCHAR(100) NOT NULL,
  answer INT NOT NULL,
  player_answer INT,
  response_time INT NOT NULL DEFAULT 0,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (problemID),
  INDEX idx_problem_run (runID),
  INDEX idx_problem_operation (op_type),
  INDEX idx_problem_correct (is_correct),
  CONSTRAINT chk_problem_world CHECK (world_level BETWEEN 1 AND 3),
  CONSTRAINT chk_problem_battle CHECK (battle_number BETWEEN 1 AND 5),
  CONSTRAINT chk_problem_time CHECK (response_time >= 0),
  FOREIGN KEY (runID) REFERENCES Run(runID) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Combat (
  combatID INT NOT NULL AUTO_INCREMENT,
  runID INT NOT NULL,
  enemyID INT NOT NULL,
  problemID INT,
  timer_result ENUM('green','yellow','red','timeout') NOT NULL DEFAULT 'timeout',
  damage_dealt INT NOT NULL DEFAULT 0,
  combat_result ENUM('win','lose','ongoing') NOT NULL DEFAULT 'ongoing',
  played_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (combatID),
  INDEX idx_combat_run (runID),
  INDEX idx_combat_enemy (enemyID),
  INDEX idx_combat_result (combat_result),
  CONSTRAINT chk_combat_damage CHECK (damage_dealt >= 0),
  FOREIGN KEY (runID) REFERENCES Run(runID) ON DELETE CASCADE,
  FOREIGN KEY (enemyID) REFERENCES Enemy(enemyID),
  FOREIGN KEY (problemID) REFERENCES ProblemStats(problemID) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE CardsUsed (
  combatID INT NOT NULL,
  cardID INT NOT NULL,
  turn_number TINYINT NOT NULL DEFAULT 1,
  card_result ENUM('full','weakened','failed') NOT NULL DEFAULT 'full',
  PRIMARY KEY (combatID, cardID, turn_number),
  CONSTRAINT chk_card_turn CHECK (turn_number BETWEEN 1 AND 10),
  FOREIGN KEY (combatID) REFERENCES Combat(combatID) ON DELETE CASCADE,
  FOREIGN KEY (cardID) REFERENCES Card(cardID)
) ENGINE=InnoDB;

CREATE TABLE PlayerStats (
  playerStatsID INT NOT NULL AUTO_INCREMENT,
  playerID INT NOT NULL,
  world_number TINYINT NOT NULL,
  difficulty_progress VARCHAR(50) NOT NULL DEFAULT 'tier_1',
  enemies_defeated INT NOT NULL DEFAULT 0,
  problems_solved INT NOT NULL DEFAULT 0,
  average_speed FLOAT NOT NULL DEFAULT 0,
  time_played FLOAT NOT NULL DEFAULT 0,
  PRIMARY KEY (playerStatsID),
  UNIQUE KEY uniq_player_world (playerID, world_number),
  CONSTRAINT chk_stats_world CHECK (world_number BETWEEN 1 AND 3),
  CONSTRAINT chk_stats_nonnegative CHECK (
  enemies_defeated >= 0 AND problems_solved >= 0 AND average_speed >= 0 AND time_played >= 0
),
  FOREIGN KEY (playerID) REFERENCES Player(playerID) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE OR REPLACE VIEW v_player_overview AS
SELECT
p.playerID,
p.username,
COUNT(DISTINCT r.runID) AS total_runs,
SUM(CASE WHEN r.result = 'win' THEN 1 ELSE 0 END) AS wins,
SUM(CASE WHEN r.result = 'lose' THEN 1 ELSE 0 END) AS losses,
COALESCE(SUM(r.duration), 0) AS total_seconds_played
FROM Player p
  LEFT JOIN Run r ON p.playerID = r.playerID
GROUP BY p.playerID, p.username;

CREATE OR REPLACE VIEW v_run_summary AS
SELECT
r.runID,
p.username,
m.name AS map_name,
r.world_level,
r.duration,
r.enemies_defeated,
r.result,
COUNT(DISTINCT c.combatID) AS combats_played,
COUNT(DISTINCT ps.problemID) AS problems_attempted,
SUM(CASE WHEN ps.is_correct THEN 1 ELSE 0 END) AS correct_answers
FROM Run r
  JOIN Player p ON r.playerID = p.playerID
  LEFT JOIN Map m ON r.mapID = m.mapID
  LEFT JOIN Combat c ON r.runID = c.runID
  LEFT JOIN ProblemStats ps ON r.runID = ps.runID
GROUP BY r.runID, p.username, m.name, r.world_level, r.duration, r.enemies_defeated, r.result;

CREATE OR REPLACE VIEW v_world_difficulty AS
SELECT
world_level,
COUNT(*) AS runs,
SUM(result = 'win') AS wins,
ROUND(SUM(result = 'win') / NULLIF(COUNT(*),0) * 100, 2) AS win_rate_percent,
ROUND(AVG(duration), 2) AS avg_duration_seconds,
ROUND(AVG(enemies_defeated), 2) AS avg_enemies_defeated
FROM Run
GROUP BY world_level;

CREATE OR REPLACE VIEW v_problem_accuracy_by_operation AS
SELECT
op_type,
difficulty,
COUNT(*) AS attempts,
SUM(is_correct) AS correct_answers,
ROUND(SUM(is_correct) / NULLIF(COUNT(*),0) * 100, 2) AS accuracy_percent,
ROUND(AVG(response_time), 2) AS avg_response_time_ms
FROM ProblemStats
GROUP BY op_type, difficulty;

CREATE OR REPLACE VIEW v_card_usage AS
SELECT
ca.cardID,
ca.name AS card_name,
ca.type,
ca.special,
COUNT(cu.combatID) AS times_used
FROM Card ca
  LEFT JOIN CardsUsed cu ON ca.cardID = cu.cardID
GROUP BY ca.cardID, ca.name, ca.type, ca.special;

CREATE OR REPLACE VIEW v_card_success AS
SELECT
ca.cardID,
ca.name AS card_name,
ca.type,
COUNT(*) AS uses,
SUM(c.combat_result = 'win') AS winning_uses,
ROUND(SUM(c.combat_result = 'win') / NULLIF(COUNT(*),0) * 100, 2) AS win_use_percent
FROM CardsUsed cu
  JOIN Card ca ON cu.cardID = ca.cardID
  JOIN Combat c ON cu.combatID = c.combatID
GROUP BY ca.cardID, ca.name, ca.type;

CREATE OR REPLACE VIEW v_enemy_performance AS
SELECT
e.enemyID,
e.name AS enemy_name,
e.type,
e.world_level,
COUNT(c.combatID) AS combats,
SUM(c.combat_result = 'lose') AS player_losses_against_enemy,
ROUND(AVG(c.damage_dealt), 2) AS avg_damage_dealt
FROM Enemy e
  LEFT JOIN Combat c ON e.enemyID = c.enemyID
GROUP BY e.enemyID, e.name, e.type, e.world_level;

CREATE OR REPLACE VIEW v_active_deck AS
SELECT
p.playerID,
p.username,
d.deckID,
ca.cardID,
ca.name AS card_name,
ca.type,
ca.power_value,
ca.special
FROM Player p
  JOIN Deck d ON p.playerID = d.playerID
  JOIN DeckCard dc ON d.deckID = dc.deckID
  JOIN Card ca ON dc.cardID = ca.cardID
WHERE dc.is_active = TRUE;

CREATE OR REPLACE VIEW v_equipped_skill AS
SELECT
p.playerID,
p.username,
ca.cardID,
ca.name AS equipped_skill,
ca.description,
sd.unlocked_at
FROM SkillDeck sd
  JOIN Player p ON sd.playerID = p.playerID
  JOIN Card ca ON sd.cardID = ca.cardID
WHERE sd.is_equipped = TRUE;

CREATE OR REPLACE VIEW v_combat_detail AS
SELECT
c.combatID,
p.username,
r.runID,
e.name AS enemy_name,
e.type AS enemy_type,
ps.expression,
ps.player_answer,
ps.answer,
ps.is_correct,
c.timer_result,
c.damage_dealt,
c.combat_result,
c.played_at
FROM Combat c
  JOIN Run r ON c.runID = r.runID
  JOIN Player p ON r.playerID = p.playerID
  JOIN Enemy e ON c.enemyID = e.enemyID
  LEFT JOIN ProblemStats ps ON c.problemID = ps.problemID;

CREATE OR REPLACE VIEW v_player_learning_progress AS
SELECT
p.playerID,
p.username,
ps.world_level,
COUNT(ps.problemID) AS attempts,
SUM(ps.is_correct) AS correct_answers,
ROUND(SUM(ps.is_correct) / NULLIF(COUNT(ps.problemID),0) * 100, 2) AS accuracy_percent,
ROUND(AVG(ps.response_time), 2) AS avg_response_time_ms
FROM Player p
  JOIN Run r ON p.playerID = r.playerID
  JOIN ProblemStats ps ON r.runID = ps.runID
GROUP BY p.playerID, p.username, ps.world_level;

DELIMITER $$

CREATE TRIGGER trg_player_after_insert
  AFTER INSERT ON Player
  FOR EACH ROW
BEGIN
INSERT INTO Deck(playerID) VALUES (NEW.playerID);

INSERT INTO PlayerStats(playerID, world_number)
VALUES
(NEW.playerID, 1),
(NEW.playerID, 2),
(NEW.playerID, 3);
END$$

CREATE TRIGGER trg_run_before_insert_validate
  BEFORE INSERT ON Run
  FOR EACH ROW
BEGIN
IF NEW.world_level NOT BETWEEN 1 AND 3 THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'world_level must be between 1 and 3';
END IF;
IF NEW.skin_selected NOT BETWEEN 0 AND 2 THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'skin_selected must be 0, 1, or 2';
END IF;
END$$

CREATE TRIGGER trg_problem_before_insert_grade
  BEFORE INSERT ON ProblemStats
  FOR EACH ROW
BEGIN
IF NEW.player_answer IS NULL THEN
SET NEW.is_correct = FALSE;
ELSE
SET NEW.is_correct = (NEW.player_answer = NEW.answer);
END IF;
END$$

CREATE TRIGGER trg_deckcard_before_insert_active_limit
  BEFORE INSERT ON DeckCard
  FOR EACH ROW
BEGIN
IF NEW.is_active = TRUE AND
(SELECT COUNT(*) FROM DeckCard WHERE deckID = NEW.deckID AND is_active = TRUE) >= 4 THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A player can only have 4 active cards in the combat deck';
END IF;
END$$

CREATE TRIGGER trg_skilldeck_before_insert_validate
  BEFORE INSERT ON SkillDeck
  FOR EACH ROW
BEGIN
IF (SELECT type FROM Card WHERE cardID = NEW.cardID) <> 'skill' THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only skill cards can be inserted into SkillDeck';
END IF;
IF NEW.is_equipped = TRUE AND
(SELECT COUNT(*) FROM SkillDeck WHERE playerID = NEW.playerID AND is_equipped = TRUE) >= 1 THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A player can only equip one skill card at a time';
END IF;
END$$

CREATE TRIGGER trg_combat_after_insert_update_run
  AFTER INSERT ON Combat
  FOR EACH ROW
BEGIN
IF NEW.combat_result = 'win' THEN
UPDATE Run
SET enemies_defeated = enemies_defeated + 1
WHERE runID = NEW.runID;
END IF;
END$$

CREATE TRIGGER trg_run_after_update_update_stats
  AFTER UPDATE ON Run
  FOR EACH ROW
BEGIN
IF NEW.result IN ('win','lose') AND OLD.result <> NEW.result THEN
UPDATE PlayerStats
SET
  enemies_defeated = enemies_defeated + NEW.enemies_defeated,
  time_played = time_played + NEW.duration,
  problems_solved = problems_solved + (
SELECT COUNT(*) FROM ProblemStats ps
WHERE ps.runID = NEW.runID AND ps.is_correct = TRUE
),
  average_speed = COALESCE((
SELECT AVG(ps.response_time)
FROM ProblemStats ps
  JOIN Run r ON ps.runID = r.runID
WHERE r.playerID = NEW.playerID
  AND ps.world_level = NEW.world_level
  AND ps.is_correct = TRUE
), average_speed)
WHERE playerID = NEW.playerID
  AND world_number = NEW.world_level;
END IF;
END$$

CREATE PROCEDURE sp_create_player(
  IN p_username VARCHAR(50),
  IN p_password_hash VARCHAR(255)
)
BEGIN
INSERT INTO Player(username, password)
VALUES (p_username, p_password_hash);
END$$

CREATE PROCEDURE sp_start_run(
  IN p_playerID INT,
  IN p_mapID INT,
  IN p_world_level TINYINT,
  IN p_skin_selected TINYINT
)
BEGIN
INSERT INTO Run(playerID, mapID, world_level, skin_selected)
VALUES (p_playerID, p_mapID, p_world_level, p_skin_selected);

SELECT LAST_INSERT_ID() AS new_runID;
END$$

CREATE PROCEDURE sp_submit_problem(
  IN p_runID INT,
  IN p_world_level TINYINT,
  IN p_battle_number TINYINT,
  IN p_difficulty VARCHAR(50),
  IN p_op_type VARCHAR(50),
  IN p_expression VARCHAR(100),
  IN p_answer INT,
  IN p_player_answer INT,
  IN p_response_time INT
)
BEGIN
INSERT INTO ProblemStats(
runID, world_level, battle_number, difficulty, op_type,
expression, answer, player_answer, response_time
)
VALUES (
p_runID, p_world_level, p_battle_number, p_difficulty, p_op_type,
p_expression, p_answer, p_player_answer, p_response_time
);

SELECT LAST_INSERT_ID() AS new_problemID;
END$$

CREATE PROCEDURE sp_record_combat(
  IN p_runID INT,
  IN p_enemyID INT,
  IN p_problemID INT,
  IN p_timer_result VARCHAR(20),
  IN p_damage_dealt INT,
  IN p_combat_result VARCHAR(20)
)
BEGIN
INSERT INTO Combat(runID, enemyID, problemID, timer_result, damage_dealt, combat_result)
VALUES (p_runID, p_enemyID, p_problemID, p_timer_result, p_damage_dealt, p_combat_result);

SELECT LAST_INSERT_ID() AS new_combatID;
END$$

CREATE PROCEDURE sp_add_card_to_deck(
  IN p_playerID INT,
  IN p_cardID INT,
  IN p_is_active BOOLEAN
)
BEGIN
DECLARE v_deckID INT;

SELECT deckID INTO v_deckID
FROM Deck
WHERE playerID = p_playerID;

INSERT INTO DeckCard(deckID, cardID, is_active)
VALUES (v_deckID, p_cardID, p_is_active)
  ON DUPLICATE KEY UPDATE is_active = p_is_active;
END$$

CREATE PROCEDURE sp_equip_skill(
  IN p_playerID INT,
  IN p_cardID INT
)
BEGIN
UPDATE SkillDeck
SET is_equipped = FALSE
WHERE playerID = p_playerID;

INSERT INTO SkillDeck(playerID, cardID, is_equipped)
VALUES (p_playerID, p_cardID, TRUE)
  ON DUPLICATE KEY UPDATE is_equipped = TRUE;
END$$

CREATE PROCEDURE sp_finish_run(
  IN p_runID INT,
  IN p_duration INT,
  IN p_result VARCHAR(20)
)
BEGIN
UPDATE Run
SET duration = p_duration,
  result = p_result
WHERE runID = p_runID;
END$$

DELIMITER ;
