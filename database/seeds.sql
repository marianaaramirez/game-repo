-- ============================================================
--  Math Smash: Card Adventure -- Seed Data
--  Run AFTER schemaV3.sql
--  Inserts all static game data: maps, enemies, cards
--
--  AI tool used for code generation: Claude (Anthropic)
-- ============================================================

USE mathsmash;

-- ============================================================
-- MAPS (3 worlds)
-- ============================================================
INSERT INTO Map (name, theme, world_level) VALUES
  ('Ancient Temple', 'ruins',   1),
  ('Castle',         'medieval',2),
  ('Wasteland',      'sci-fi',  3);

-- ============================================================
-- ENEMIES
-- Basic and trap enemies are seeded with world_level = 1 since
-- they are introduced in World 1; the spawning pool reuses them
-- in any world. Bosses are tied to their actual world.
-- ============================================================

-- Basic enemies (world 1 catalog, shared across worlds at runtime)
INSERT INTO Enemy (name, type, world_level, hp, attack_power, skill_name, skill_desc) VALUES
  ('Slime',          'basic', 1,  60,  5, 'Sticky Hit',     'Reduces player card effectiveness by 10% for one turn'),
  ('Spider',         'basic', 1,  55,  7, 'Web Trap',       'Disables one random card for the next turn'),
  ('Skeleton',       'basic', 1,  75,  8, 'Bone Throw',     'Deals extra damage ignoring defense'),
  ('Golem',          'basic', 1, 100,  8, 'Stone Shield',   'Reduces incoming damage by 50% for one turn'),
  ('Predator Plant', 'basic', 1,  70,  9, 'Quick Strike',   'Attacks before the player if time is low'),
  ('Evil Bat',       'basic', 1,  50,  6, 'Sonic Screech',  'Reduces timer duration by 2 seconds');

-- Trap enemies (chest encounters)
INSERT INTO Enemy (name, type, world_level, hp, attack_power, skill_name, skill_desc) VALUES
  ('Card Thief', 'trap', 1, 50, 4, 'Steal Card', 'Locks one card until the player answers correctly'),
  ('Swapper',    'trap', 1, 50, 4, 'Chaos Swap', 'Replaces one card with a random one temporarily');

-- Bosses (one per world)
INSERT INTO Enemy (name, type, world_level, hp, attack_power, skill_name, skill_desc) VALUES
  ('Vampire King', 'boss', 1, 150, 12, 'Royal Command', 'Performs two actions in one turn'),
  ('Bone Mage',    'boss', 2, 130, 10, 'Double Action', 'Increases enemy damage for one turn'),
  ('Titan',        'boss', 3, 200, 15, 'Earth Smash',   'Deals heavy damage but has a delay');

-- ============================================================
-- CARDS - ATTACK (7 per world, 21 total)
-- ============================================================

-- World 1 attack cards
INSERT INTO Card (name, type, world_level, description, power_value, special) VALUES
  ('Quick Jab',        'attack', 1, 'A fast, light strike',              10, 'none'),
  ('Temple Strike',    'attack', 1, 'A solid hit on the enemy',          16, 'none'),
  ('Vampiric Bite',    'attack', 1, 'Deals damage and heals you',        14, 'lifesteal'),
  ('Reckless Swing',   'attack', 1, 'Big damage, small recoil',          22, 'reckless'),
  ('Armor Piercer',    'attack', 1, 'Pierces through enemy defenses',    12, 'pierce'),
  ('Lucky Strike',     'attack', 1, '25% chance to deal double damage',  12, 'crit'),
  ('Poison Dart',      'attack', 1, 'Causes bleeding over 2 turns',       8, 'bleed');

-- World 2 attack cards
INSERT INTO Card (name, type, world_level, description, power_value, special) VALUES
  ('Knight Slash',     'attack', 2, 'A trained sword strike',            18, 'none'),
  ('Royal Lance',      'attack', 2, 'A piercing lance thrust',           24, 'none'),
  ('Blood Saber',      'attack', 2, 'Damages the enemy and heals you',   20, 'lifesteal'),
  ('Berserk Charge',   'attack', 2, 'Huge damage with recoil',           32, 'reckless'),
  ('Lance Pierce',     'attack', 2, 'Pierces armor and defenses',        20, 'pierce'),
  ('Critical Slash',   'attack', 2, '25% chance to deal double damage',  20, 'crit'),
  ('Venom Blade',      'attack', 2, 'Causes bleeding over 2 turns',      14, 'bleed');

-- World 3 attack cards
INSERT INTO Card (name, type, world_level, description, power_value, special) VALUES
  ('Plasma Shot',      'attack', 3, 'A burst of plasma energy',          26, 'none'),
  ('Meteor Strike',    'attack', 3, 'Calls down a meteor',               34, 'none'),
  ('Soul Drain',       'attack', 3, 'Drains the enemy life force',       28, 'lifesteal'),
  ('Doom Blast',       'attack', 3, 'Devastating blast with recoil',     44, 'reckless'),
  ('Void Pierce',      'attack', 3, 'Pierces all defenses',              30, 'pierce'),
  ('Critical Beam',    'attack', 3, '25% chance to deal double damage',  28, 'crit'),
  ('Plague Bomb',      'attack', 3, 'Causes heavy bleeding over 3 turns',22, 'bleed');

-- ============================================================
-- CARDS - DEFENSE (9 per world, 27 total)
-- ============================================================

-- World 1 defense cards
INSERT INTO Card (name, type, world_level, description, power_value, special) VALUES
  ('Stone Guard',      'defense', 1, 'Blocks incoming damage',                       12, 'none'),
  ('Sturdy Block',     'defense', 1, 'Blocks a large amount of damage',              18, 'none'),
  ('Healing Ward',     'defense', 1, 'Blocks damage and heals you',                  14, 'heal'),
  ('Thorn Shield',     'defense', 1, 'Blocks and reflects damage',                   13, 'counter'),
  ('Reflect Aura',     'defense', 1, 'Reflects all damage back (no block)',          10, 'reflect'),
  ('Renewal Ward',     'defense', 1, 'Blocks + regenerates HP over time',            12, 'regen'),
  ('Taunt Helm',       'defense', 1, 'Blocks + may force enemy to use skill',        14, 'taunt'),
  ('Phantom Cloak',    'defense', 1, 'Blocks + 30% chance to dodge next attack',     12, 'evade'),
  ('Sustain Wall',     'defense', 1, 'Blocks + defense lasts an extra turn',         10, 'barrier');

-- World 2 defense cards
INSERT INTO Card (name, type, world_level, description, power_value, special) VALUES
  ('Iron Wall',        'defense', 2, 'Blocks incoming damage',                       20, 'none'),
  ('Castle Aegis',     'defense', 2, 'Blocks a heavy amount of damage',              28, 'none'),
  ('Mending Barrier',  'defense', 2, 'Blocks damage and heals you',                  20, 'heal'),
  ('Spiked Rampart',   'defense', 2, 'Blocks and reflects damage',                   18, 'counter'),
  ('Mirror Plate',     'defense', 2, 'Reflects all damage back (no block)',          16, 'reflect'),
  ('Mending Mantle',   'defense', 2, 'Blocks + regenerates HP over time',            20, 'regen'),
  ('Knight''s Roar',   'defense', 2, 'Blocks + may force enemy to use skill',        22, 'taunt'),
  ('Shadow Step',      'defense', 2, 'Blocks + 30% chance to dodge next attack',     18, 'evade'),
  ('Iron Bulwark',     'defense', 2, 'Blocks + defense lasts an extra turn',         16, 'barrier');

-- World 3 defense cards
INSERT INTO Card (name, type, world_level, description, power_value, special) VALUES
  ('Force Field',      'defense', 3, 'Blocks incoming damage',                       28, 'none'),
  ('Aegis Protocol',   'defense', 3, 'Blocks a massive amount of damage',            38, 'none'),
  ('Nano Repair',      'defense', 3, 'Blocks damage and heals you',                  28, 'heal'),
  ('Reflect Barrier',  'defense', 3, 'Blocks and reflects damage',                   26, 'counter'),
  ('Void Reflector',   'defense', 3, 'Reflects all damage back (no block)',          24, 'reflect'),
  ('Nano Regen Field', 'defense', 3, 'Blocks + regenerates HP over time',            28, 'regen'),
  ('Plasma Taunt',     'defense', 3, 'Blocks + may force enemy to use skill',        32, 'taunt'),
  ('Ghost Phase',      'defense', 3, 'Blocks + 30% chance to dodge next attack',     26, 'evade'),
  ('Adamant Barrier',  'defense', 3, 'Blocks + defense lasts an extra turn',         24, 'barrier');

-- ============================================================
-- CARDS - SKILL (5 total)
-- Skill cards are awarded after boss wins and are not tied to a
-- specific world. world_level = 0 marks them as shared/any-world.
-- ============================================================
INSERT INTO Card (name, type, world_level, description, power_value, special) VALUES
  ('Second Chance', 'skill', 0, 'Retry a failed operation',                 0, 'second_chance'),
  ('Freeze Time',   'skill', 0, 'Pauses time for 4 seconds',                0, 'freeze_time'),
  ('Clear Mind',    'skill', 0, 'Next card does not require activation',    0, 'clear_mind'),
  ('Double Power',  'skill', 0, 'Doubles the points of next card',          0, 'double_power'),
  ('Vitality Boost','skill', 0, 'Gives 10% more life',                      0, 'vitality_boost');

-- AI tool used for code commenting: Claude (Anthropic)
