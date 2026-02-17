-- Game Service table for casino games

-- Games table - stores casino game information
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- Slots, Live, Table, Originals, Hot, Recent, Favorites
  provider TEXT NOT NULL, -- Pragmatic Play, Evolution, Rainbet, etc.
  image TEXT NOT NULL,
  description TEXT,
  game_url TEXT NOT NULL, -- URL to launch the game
  status TEXT CHECK (status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
  min_bet NUMERIC(10,2) DEFAULT 10.00,
  max_bet NUMERIC(10,2) DEFAULT 10000.00,
  rating NUMERIC(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
  is_hot BOOLEAN DEFAULT FALSE,
  bonus_multiplier NUMERIC(5,2),
  metadata JSONB, -- Game-specific data (rules, settings, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_games_category ON games(category);
CREATE INDEX IF NOT EXISTS idx_games_provider ON games(provider);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_is_hot ON games(is_hot);
CREATE INDEX IF NOT EXISTS idx_games_name ON games(name);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);
