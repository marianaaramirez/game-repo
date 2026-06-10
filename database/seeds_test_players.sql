-- ============================================================
--  Math Smash: Card Adventure -- Test Players Seed
--  Run AFTER seeds.sql (catalog tables must already exist)
--
--  Creates 4 test players with runs, combats, and problem stats
--  to verify the StatsScene and Leaderboard.
--
--  Passwords (all): "password123"
--  Login with any of these usernames to see their stats.
--
--  Players:
--    DragonSlayer99 — veteran, won all 3 worlds, high accuracy
--    MathWizard     — slow but accurate, worlds 1-2
--    NoviceHero     — beginner, only world 1, all losses
--    SpeedRunner    — fast answers, worlds 1-3, mixed results
--
--  To run:
--    mysql -u root -p mathsmash < database/seeds_test_players.sql
--  Or from project root:
--    node -e "
--      import fs from 'fs/promises';
--      import mysql from 'mysql2/promise';
--      import dotenv from 'dotenv';
--      dotenv.config({path:'server/.env'});
--      const c = await mysql.createConnection({host:process.env.DB_HOST,user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME,multipleStatements:true});
--      await c.query(await fs.readFile('database/seeds_test_players.sql','utf8'));
--      await c.end(); console.log('done');
--    "
-- ============================================================

USE mathsmash;

-- ============================================================
-- PLAYERS  (password = "password123" bcrypt hash)
-- ============================================================
INSERT INTO Player (username, password, created_at) VALUES
  ('DragonSlayer99', '$2b$10$e9HZZg.u08JV8leh33kzougAiHffhxOuSpN92rzvWoc.0nKkcH7UO', '2025-01-10 10:00:00'),
  ('MathWizard',     '$2b$10$MAsRoy0JAvfHjxSfOHi83.PlToDv.Pey84BdrW6GON4qxaiUBGO2G', '2025-01-12 14:00:00'),
  ('NoviceHero',     '$2b$10$g0uIMkXl4kV/gqp8Qb1Pmunqu84pSnoaMJ9pgUXqdrNHKrblaaIym', '2025-01-15 09:00:00'),
  ('SpeedRunner',    '$2b$10$FSLAuWvjr4w/cYjUCyLVue5w/HOxwZoCl7jjxPpXr3I0nynn1Rt4q', '2025-01-18 16:00:00');
-- playerID: 1=DragonSlayer99  2=MathWizard  3=NoviceHero  4=SpeedRunner

-- ============================================================
-- DECKS  (one per player)
-- ============================================================
INSERT INTO Deck (playerID, creation_date) VALUES
  (1, '2025-01-10 10:05:00'),
  (2, '2025-01-12 14:05:00'),
  (3, '2025-01-15 09:05:00'),
  (4, '2025-01-18 16:05:00');
-- deckID: 1=DragonSlayer99  2=MathWizard  3=NoviceHero  4=SpeedRunner

-- ============================================================
-- DECK CARDS
-- Attack IDs:  1=Quick Jab  2=Temple Strike  3=Vampiric Bite
--              4=Reckless Swing  6=Lucky Strike  9=Royal Lance
--              15=Plasma Shot
-- Defense IDs: 22=Stone Guard  23=Sturdy Block  24=Healing Ward
--              31=Iron Wall
-- ============================================================
-- DragonSlayer99: mixed veteran deck (w1+w2 cards)
INSERT INTO DeckCard (deckID, cardID, is_active) VALUES
  (1, 2,  TRUE),
  (1, 3,  TRUE),
  (1, 9,  TRUE),
  (1, 23, TRUE),
  (1, 1,  FALSE),
  (1, 22, FALSE);

-- MathWizard: world 1 cards
INSERT INTO DeckCard (deckID, cardID, is_active) VALUES
  (2, 1,  TRUE),
  (2, 2,  TRUE),
  (2, 22, TRUE),
  (2, 24, TRUE),
  (2, 6,  FALSE);

-- NoviceHero: minimal starter
INSERT INTO DeckCard (deckID, cardID, is_active) VALUES
  (3, 1,  TRUE),
  (3, 22, TRUE);

-- SpeedRunner: aggressive deck (w1+w2+w3 cards)
INSERT INTO DeckCard (deckID, cardID, is_active) VALUES
  (4, 4,  TRUE),
  (4, 9,  TRUE),
  (4, 15, TRUE),
  (4, 23, TRUE),
  (4, 6,  FALSE);

-- ============================================================
-- SKILL DECKS  (earned by beating bosses — persist through deaths)
-- Skill cardIDs: 49=Second Chance  50=Freeze Time  51=Clear Mind
--                52=Double Power   53=Vitality Boost
-- ============================================================
INSERT INTO SkillDeck (playerID, cardID, is_equipped, unlocked_at) VALUES
  (1, 49, FALSE, '2025-01-11 12:00:00'),
  (1, 50, TRUE,  '2025-01-12 09:00:00'),
  (1, 51, FALSE, '2025-01-13 15:00:00'),
  (2, 49, TRUE,  '2025-01-13 11:00:00'),
  (4, 52, TRUE,  '2025-01-19 10:00:00');

-- ============================================================
-- RUNS
-- skin: 0=Warrior  1=Mage  2=Rogue
-- ============================================================
INSERT INTO Run (playerID, world_level, skin_selected, start_date, duration, enemies_defeated, result) VALUES
  -- DragonSlayer99 (4 runs, all wins across all 3 worlds)
  (1, 1, 0, '2025-01-10 10:10:00', 185, 5, 'win'),   -- runID 1
  (1, 2, 0, '2025-01-11 11:00:00', 245, 5, 'win'),   -- runID 2
  (1, 3, 0, '2025-01-12 09:00:00', 305, 6, 'win'),   -- runID 3
  (1, 1, 0, '2025-01-13 14:00:00', 190, 5, 'win'),   -- runID 4
  -- MathWizard (3 runs: 2 wins world 1, 1 loss world 2)
  (2, 1, 1, '2025-01-12 15:00:00', 325, 5, 'win'),   -- runID 5
  (2, 2, 1, '2025-01-13 10:00:00', 215, 3, 'lose'),  -- runID 6
  (2, 1, 1, '2025-01-14 16:00:00', 285, 5, 'win'),   -- runID 7
  -- NoviceHero (3 runs, all losses in world 1)
  (3, 1, 0, '2025-01-15 09:10:00', 125, 2, 'lose'),  -- runID 8
  (3, 1, 0, '2025-01-16 10:00:00',  95, 1, 'lose'),  -- runID 9
  (3, 1, 0, '2025-01-17 11:00:00', 155, 3, 'lose'),  -- runID 10
  -- SpeedRunner (4 runs: 3 wins, 1 loss)
  (4, 1, 2, '2025-01-18 16:10:00', 145, 5, 'win'),   -- runID 11
  (4, 2, 2, '2025-01-19 09:00:00', 195, 5, 'win'),   -- runID 12
  (4, 3, 2, '2025-01-20 14:00:00', 225, 4, 'lose'),  -- runID 13
  (4, 2, 2, '2025-01-21 10:00:00', 175, 5, 'win');   -- runID 14

-- ============================================================
-- PROBLEM STATS
-- IDs auto-increment from 1. Counts per run:
--   Run  1: 8 probs  → IDs  1- 8
--   Run  2: 7 probs  → IDs  9-15
--   Run  3: 7 probs  → IDs 16-22
--   Run  4: 5 probs  → IDs 23-27
--   Run  5: 6 probs  → IDs 28-33
--   Run  6: 4 probs  → IDs 34-37
--   Run  7: 5 probs  → IDs 38-42
--   Run  8: 3 probs  → IDs 43-45
--   Run  9: 2 probs  → IDs 46-47
--   Run 10: 4 probs  → IDs 48-51
--   Run 11: 6 probs  → IDs 52-57
--   Run 12: 5 probs  → IDs 58-62
--   Run 13: 5 probs  → IDs 63-67
--   Run 14: 5 probs  → IDs 68-72
-- ============================================================

-- Run 1: DragonSlayer99, World 1, win — fast and accurate
INSERT INTO ProblemStats (runID, world_level, battle_number, difficulty, op_type, expression, answer, player_answer, response_time, is_correct) VALUES
  (1, 1, 1, 'tier_1', 'addition',    '7 + 5',         12,  12, 2100, TRUE),
  (1, 1, 1, 'tier_1', 'subtraction', '9 - 3',          6,   6, 1950, TRUE),
  (1, 1, 2, 'tier_2', 'addition',    '23 + 14',        37,  37, 3200, TRUE),
  (1, 1, 2, 'tier_2', 'subtraction', '38 - 15',        23,  23, 2800, TRUE),
  (1, 1, 3, 'tier_3', 'addition',    '52 + 43',        95,  95, 4100, TRUE),
  (1, 1, 4, 'tier_4', 'mixed',       '12 + 8 - 5',     15,  15, 4500, TRUE),
  (1, 1, 5, 'tier_5', 'mixed',       '45 + 23 - 18',   50,  50, 5200, TRUE),
  (1, 1, 5, 'tier_5', 'mixed',       '62 + 41 - 25',   78,  78, 4900, TRUE);

-- Run 2: DragonSlayer99, World 2, win
INSERT INTO ProblemStats (runID, world_level, battle_number, difficulty, op_type, expression, answer, player_answer, response_time, is_correct) VALUES
  (2, 2, 1, 'tier_1', 'multiplication', '4 x 7',      28,  28, 2300, TRUE),
  (2, 2, 2, 'tier_2', 'multiplication', '3 x 14',     42,  42, 3400, TRUE),
  (2, 2, 3, 'tier_3', 'division',       '36 / 4',      9,   9, 3100, TRUE),
  (2, 2, 3, 'tier_3', 'multiplication', '5 x 16',     80,  80, 3600, TRUE),
  (2, 2, 4, 'tier_4', 'multiplication', '15 x 6',     90,  90, 4200, TRUE),
  (2, 2, 5, 'tier_5', 'division',       '56 / 7',      8,   8, 3900, TRUE),
  (2, 2, 5, 'tier_5', 'multiplication', '18 x 7',    126, 126, 4800, TRUE);

-- Run 3: DragonSlayer99, World 3, win
INSERT INTO ProblemStats (runID, world_level, battle_number, difficulty, op_type, expression, answer, player_answer, response_time, is_correct) VALUES
  (3, 3, 1, 'tier_1', 'mixed', '2 + 3 x 4',      14,  14, 3200, TRUE),
  (3, 3, 2, 'tier_2', 'mixed', '5 x 6 - 8',      22,  22, 3800, TRUE),
  (3, 3, 2, 'tier_2', 'mixed', '3 + 4 x 5',      23,  23, 4100, TRUE),
  (3, 3, 3, 'tier_3', 'mixed', '6 + 3 x 12',     42,  42, 4500, TRUE),
  (3, 3, 4, 'tier_4', 'mixed', '7 x 8 - 15',     41,  41, 4900, TRUE),
  (3, 3, 5, 'tier_5', 'mixed', '14 x 13 + 6',   188, 188, 6200, TRUE),
  (3, 3, 5, 'tier_5', 'mixed', '11 + 15 x 12',  191, 191, 5800, TRUE);

-- Run 4: DragonSlayer99, World 1, second win
INSERT INTO ProblemStats (runID, world_level, battle_number, difficulty, op_type, expression, answer, player_answer, response_time, is_correct) VALUES
  (4, 1, 1, 'tier_1', 'addition',    '8 + 6',         14,  14, 1800, TRUE),
  (4, 1, 2, 'tier_2', 'addition',    '31 + 22',        53,  53, 2700, TRUE),
  (4, 1, 3, 'tier_3', 'subtraction', '71 - 33',        38,  38, 3300, TRUE),
  (4, 1, 4, 'tier_4', 'mixed',       '15 + 20 - 8',    27,  27, 3900, TRUE),
  (4, 1, 5, 'tier_5', 'mixed',       '55 + 30 - 22',   63,  63, 4700, TRUE);

-- Run 5: MathWizard, World 1, win — slow but accurate (one wrong)
INSERT INTO ProblemStats (runID, world_level, battle_number, difficulty, op_type, expression, answer, player_answer, response_time, is_correct) VALUES
  (5, 1, 1, 'tier_1', 'addition',    '4 + 9',         13,  13, 4800, TRUE),
  (5, 1, 1, 'tier_1', 'subtraction', '8 - 3',          5,   9, 5200, FALSE),
  (5, 1, 2, 'tier_2', 'addition',    '27 + 18',        45,  45, 5900, TRUE),
  (5, 1, 3, 'tier_3', 'addition',    '64 + 29',        93,  93, 6100, TRUE),
  (5, 1, 4, 'tier_4', 'mixed',       '18 + 12 - 7',    23,  23, 6400, TRUE),
  (5, 1, 5, 'tier_5', 'mixed',       '48 + 35 - 21',   62,  62, 7200, TRUE);

-- Run 6: MathWizard, World 2, lose — timeout on boss
INSERT INTO ProblemStats (runID, world_level, battle_number, difficulty, op_type, expression, answer, player_answer, response_time, is_correct) VALUES
  (6, 2, 1, 'tier_1', 'multiplication', '6 x 7',      42,   42, 5100, TRUE),
  (6, 2, 2, 'tier_2', 'multiplication', '4 x 13',     52,   52, 6300, TRUE),
  (6, 2, 3, 'tier_3', 'division',       '45 / 9',      5, NULL, 10000, FALSE),
  (6, 2, 3, 'tier_3', 'multiplication', '7 x 15',    105,   15, 5800, FALSE);

-- Run 7: MathWizard, World 1, second win
INSERT INTO ProblemStats (runID, world_level, battle_number, difficulty, op_type, expression, answer, player_answer, response_time, is_correct) VALUES
  (7, 1, 1, 'tier_1', 'addition',    '6 + 7',         13,  13, 4500, TRUE),
  (7, 1, 2, 'tier_2', 'subtraction', '35 - 17',        18,  18, 5600, TRUE),
  (7, 1, 3, 'tier_3', 'addition',    '58 + 34',        92,  92, 5800, TRUE),
  (7, 1, 4, 'tier_4', 'mixed',       '22 + 11 - 9',    24,  24, 6100, TRUE),
  (7, 1, 5, 'tier_5', 'mixed',       '51 + 28 - 19',   60,  60, 6900, TRUE);

-- Run 8: NoviceHero, World 1, lose — wrong answers + timeout
INSERT INTO ProblemStats (runID, world_level, battle_number, difficulty, op_type, expression, answer, player_answer, response_time, is_correct) VALUES
  (8, 1, 1, 'tier_1', 'addition',    '5 + 7',  12,    9, 6800, FALSE),
  (8, 1, 1, 'tier_1', 'subtraction', '9 - 4',   5, NULL, 10000, FALSE),
  (8, 1, 2, 'tier_2', 'addition',    '22 + 15', 37,   37, 7500, TRUE);

-- Run 9: NoviceHero, World 1, lose fast
INSERT INTO ProblemStats (runID, world_level, battle_number, difficulty, op_type, expression, answer, player_answer, response_time, is_correct) VALUES
  (9, 1, 1, 'tier_1', 'addition',    '3 + 8', 11, NULL, 10000, FALSE),
  (9, 1, 1, 'tier_1', 'subtraction', '7 - 2',  5,    8, 5500, FALSE);

-- Run 10: NoviceHero, World 1, lose — slightly better attempt
INSERT INTO ProblemStats (runID, world_level, battle_number, difficulty, op_type, expression, answer, player_answer, response_time, is_correct) VALUES
  (10, 1, 1, 'tier_1', 'addition',    '6 + 5',   11,   11, 5900, TRUE),
  (10, 1, 2, 'tier_2', 'addition',    '19 + 24', 43,   43, 7200, TRUE),
  (10, 1, 2, 'tier_2', 'subtraction', '33 - 18', 15,   12, 6500, FALSE),
  (10, 1, 3, 'tier_3', 'addition',    '47 + 38', 85, NULL, 10000, FALSE);

-- Run 11: SpeedRunner, World 1, win — very fast
INSERT INTO ProblemStats (runID, world_level, battle_number, difficulty, op_type, expression, answer, player_answer, response_time, is_correct) VALUES
  (11, 1, 1, 'tier_1', 'addition',    '9 + 4',         13, 13, 1200, TRUE),
  (11, 1, 2, 'tier_2', 'subtraction', '37 - 14',        23, 23, 1500, TRUE),
  (11, 1, 2, 'tier_2', 'addition',    '28 + 19',        47, 47, 1700, TRUE),
  (11, 1, 3, 'tier_3', 'addition',    '61 + 27',        88, 88, 2100, TRUE),
  (11, 1, 4, 'tier_4', 'mixed',       '16 + 9 - 7',     18, 18, 2400, TRUE),
  (11, 1, 5, 'tier_5', 'mixed',       '53 + 24 - 17',   60, 60, 2800, TRUE);

-- Run 12: SpeedRunner, World 2, win — fast but one wrong
INSERT INTO ProblemStats (runID, world_level, battle_number, difficulty, op_type, expression, answer, player_answer, response_time, is_correct) VALUES
  (12, 2, 1, 'tier_1', 'multiplication', '8 x 6',   48,  48, 1400, TRUE),
  (12, 2, 2, 'tier_2', 'multiplication', '5 x 12',  60,  60, 1800, TRUE),
  (12, 2, 3, 'tier_3', 'division',       '48 / 6',   8,   8, 1600, TRUE),
  (12, 2, 4, 'tier_4', 'multiplication', '13 x 7',  91,  14, 2200, FALSE),
  (12, 2, 5, 'tier_5', 'multiplication', '16 x 9', 144, 144, 2900, TRUE);

-- Run 13: SpeedRunner, World 3, lose — failed boss
INSERT INTO ProblemStats (runID, world_level, battle_number, difficulty, op_type, expression, answer, player_answer, response_time, is_correct) VALUES
  (13, 3, 1, 'tier_1', 'mixed', '3 + 5 x 2',     13,  13, 1500, TRUE),
  (13, 3, 2, 'tier_2', 'mixed', '4 x 7 - 9',     19,  19, 1900, TRUE),
  (13, 3, 3, 'tier_3', 'mixed', '8 + 6 x 11',    74,  74, 2400, TRUE),
  (13, 3, 4, 'tier_4', 'mixed', '9 x 8 - 14',    58,  58, 2600, TRUE),
  (13, 3, 5, 'tier_5', 'mixed', '12 + 17 x 13', 233,  29, 3100, FALSE);

-- Run 14: SpeedRunner, World 2, second win
INSERT INTO ProblemStats (runID, world_level, battle_number, difficulty, op_type, expression, answer, player_answer, response_time, is_correct) VALUES
  (14, 2, 1, 'tier_1', 'multiplication', '5 x 9',   45,  45, 1300, TRUE),
  (14, 2, 2, 'tier_2', 'multiplication', '6 x 11',  66,  66, 1600, TRUE),
  (14, 2, 3, 'tier_3', 'division',       '54 / 6',   9,   9, 1500, TRUE),
  (14, 2, 4, 'tier_4', 'multiplication', '14 x 8', 112, 112, 2100, TRUE),
  (14, 2, 5, 'tier_5', 'multiplication', '17 x 6', 102, 102, 2500, TRUE);

-- ============================================================
-- COMBATS
-- problemID = last/relevant problem from that battle
-- Verified IDs: Run1→1-8, Run2→9-15, Run3→16-22, Run4→23-27
--               Run5→28-33, Run6→34-37, Run7→38-42, Run8→43-45
--               Run9→46-47, Run10→48-51, Run11→52-57, Run12→58-62
--               Run13→63-67, Run14→68-72
-- Enemy IDs: 1=Slime 2=Spider 3=Skeleton 4=Golem 5=PredatorPlant
--            6=EvilBat 9=VampireKing 10=BoneMage 11=Titan
-- ============================================================

-- Run 1 (DragonSlayer99, W1, win)
INSERT INTO Combat (runID, enemyID, problemID, timer_result, damage_dealt, combat_result, played_at) VALUES
  (1, 1,  2, 'green',  52,  'win', '2025-01-10 10:12:00'),
  (1, 2,  4, 'green',  38,  'win', '2025-01-10 10:22:00'),
  (1, 9,  8, 'green', 140,  'win', '2025-01-10 10:45:00');

-- Run 2 (DragonSlayer99, W2, win)
INSERT INTO Combat (runID, enemyID, problemID, timer_result, damage_dealt, combat_result, played_at) VALUES
  (2, 3,   9, 'green',  65, 'win', '2025-01-11 11:15:00'),
  (2, 4,  13, 'green',  90, 'win', '2025-01-11 11:35:00'),
  (2, 10, 15, 'green', 120, 'win', '2025-01-11 12:00:00');

-- Run 3 (DragonSlayer99, W3, win)
INSERT INTO Combat (runID, enemyID, problemID, timer_result, damage_dealt, combat_result, played_at) VALUES
  (3, 1,  16, 'green',  70, 'win', '2025-01-12 09:20:00'),
  (3, 6,  20, 'yellow', 55, 'win', '2025-01-12 09:45:00'),
  (3, 11, 22, 'green', 180, 'win', '2025-01-12 10:15:00');

-- Run 4 (DragonSlayer99, W1, second win)
INSERT INTO Combat (runID, enemyID, problemID, timer_result, damage_dealt, combat_result, played_at) VALUES
  (4, 2,  23, 'green',  44, 'win', '2025-01-13 14:10:00'),
  (4, 9,  27, 'green', 135, 'win', '2025-01-13 14:40:00');

-- Run 5 (MathWizard, W1, win)
INSERT INTO Combat (runID, enemyID, problemID, timer_result, damage_dealt, combat_result, played_at) VALUES
  (5, 1,  29, 'yellow', 28, 'win', '2025-01-12 15:20:00'),
  (5, 3,  31, 'yellow', 58, 'win', '2025-01-12 15:50:00'),
  (5, 9,  33, 'yellow', 98, 'win', '2025-01-12 16:25:00');

-- Run 6 (MathWizard, W2, lose)
INSERT INTO Combat (runID, enemyID, problemID, timer_result, damage_dealt, combat_result, played_at) VALUES
  (6, 3,  34, 'yellow',  40, 'win',  '2025-01-13 10:15:00'),
  (6, 10, 37, 'timeout',  0, 'lose', '2025-01-13 10:45:00');

-- Run 7 (MathWizard, W1, second win)
INSERT INTO Combat (runID, enemyID, problemID, timer_result, damage_dealt, combat_result, played_at) VALUES
  (7, 1,  38, 'yellow', 38, 'win', '2025-01-14 16:15:00'),
  (7, 9,  42, 'yellow', 88, 'win', '2025-01-14 16:55:00');

-- Run 8 (NoviceHero, W1, lose)
INSERT INTO Combat (runID, enemyID, problemID, timer_result, damage_dealt, combat_result, played_at) VALUES
  (8, 1, 44, 'timeout',  0, 'win',  '2025-01-15 09:20:00'),
  (8, 2, 45, 'timeout', 12, 'lose', '2025-01-15 09:40:00');

-- Run 9 (NoviceHero, W1, lose fast)
INSERT INTO Combat (runID, enemyID, problemID, timer_result, damage_dealt, combat_result, played_at) VALUES
  (9, 1, 47, 'timeout', 0, 'lose', '2025-01-16 10:10:00');

-- Run 10 (NoviceHero, W1, better attempt, still lose)
INSERT INTO Combat (runID, enemyID, problemID, timer_result, damage_dealt, combat_result, played_at) VALUES
  (10, 1,  48, 'yellow', 22, 'win',  '2025-01-17 11:15:00'),
  (10, 3,  51, 'timeout', 8, 'lose', '2025-01-17 11:40:00');

-- Run 11 (SpeedRunner, W1, win, very fast)
INSERT INTO Combat (runID, enemyID, problemID, timer_result, damage_dealt, combat_result, played_at) VALUES
  (11, 1,  52, 'green',  55, 'win', '2025-01-18 16:15:00'),
  (11, 5,  55, 'green',  70, 'win', '2025-01-18 16:30:00'),
  (11, 9,  57, 'green', 148, 'win', '2025-01-18 16:50:00');

-- Run 12 (SpeedRunner, W2, win)
INSERT INTO Combat (runID, enemyID, problemID, timer_result, damage_dealt, combat_result, played_at) VALUES
  (12, 2,  58, 'green',  60, 'win', '2025-01-19 09:15:00'),
  (12, 4,  61, 'red',    45, 'win', '2025-01-19 09:35:00'),
  (12, 10, 62, 'green', 115, 'win', '2025-01-19 10:00:00');

-- Run 13 (SpeedRunner, W3, lose — failed boss)
INSERT INTO Combat (runID, enemyID, problemID, timer_result, damage_dealt, combat_result, played_at) VALUES
  (13, 6,  63, 'green', 72, 'win',  '2025-01-20 14:15:00'),
  (13, 5,  64, 'green', 88, 'win',  '2025-01-20 14:35:00'),
  (13, 11, 67, 'red',    0, 'lose', '2025-01-20 15:00:00');

-- Run 14 (SpeedRunner, W2, second win)
INSERT INTO Combat (runID, enemyID, problemID, timer_result, damage_dealt, combat_result, played_at) VALUES
  (14, 1,  68, 'green',  50, 'win', '2025-01-21 10:15:00'),
  (14, 2,  69, 'green',  62, 'win', '2025-01-21 10:35:00'),
  (14, 10, 72, 'green', 108, 'win', '2025-01-21 11:00:00');

-- ============================================================
-- EXPECTED STATS SUMMARY (for manual verification)
-- ============================================================
-- Player          | Runs | Wins | Losses | Enemies | Problems | Correct | Accuracy | Avg ms
-- DragonSlayer99  |  4   |  4   |   0    |   21    |   27     |   27    |  100%    | ~3700
-- MathWizard      |  3   |  2   |   1    |   13    |   15     |   11    |   73%    | ~6100
-- NoviceHero      |  3   |  0   |   3    |    6    |    9     |    3    |   33%    | ~7800
-- SpeedRunner     |  4   |  3   |   1    |   19    |   21     |   19    |   90%    | ~2000
--
-- Leaderboard order: DragonSlayer99 (4 wins) > SpeedRunner (3 wins) >
--                    MathWizard (2 wins) > NoviceHero (0 wins)
-- ============================================================

-- AI tool used for code commenting: Claude (Anthropic)
