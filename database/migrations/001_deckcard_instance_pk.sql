-- ============================================================
-- Migration 001: DeckCard instance-based PK
-- ============================================================
-- Reason: Player can own multiple instances of the same card.
-- The original composite PK (deckID, cardID) prevented duplicates.
-- New schema uses an auto-increment deckCardID so each owned copy
-- is its own row, and can be independently flagged as is_active.
-- ============================================================

USE mathsmash;

DROP TABLE IF EXISTS DeckCard;

CREATE TABLE DeckCard (
  deckCardID INT     NOT NULL AUTO_INCREMENT,
  deckID     INT     NOT NULL,
  cardID     INT     NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (deckCardID),
  KEY idx_deck (deckID),
  FOREIGN KEY (deckID) REFERENCES Deck(deckID) ON DELETE CASCADE,
  FOREIGN KEY (cardID) REFERENCES Card(cardID)
);
