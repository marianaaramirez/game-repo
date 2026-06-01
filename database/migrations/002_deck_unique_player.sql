-- ============================================================
-- Migration 002: UNIQUE constraint on Deck.playerID
-- ============================================================
-- Reason: Each player must have exactly one Deck row. Without a
-- UNIQUE constraint, concurrent ensureDeck() calls could create
-- duplicate rows. Also enables INSERT IGNORE pattern in the helper.
-- ============================================================

USE mathsmash;

-- Add UNIQUE on playerID. If duplicate rows already exist, the ALTER will fail
-- and you'll need to deduplicate first (this should not happen in dev).
ALTER TABLE Deck
  ADD CONSTRAINT uniq_deck_player UNIQUE (playerID);
