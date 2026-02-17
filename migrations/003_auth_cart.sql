-- Users, addresses, and cart tables; link orders to users

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('customer','merchant','corporate')) NOT NULL,
  merchant_id TEXT REFERENCES merchants(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  label TEXT,
  street TEXT,
  village TEXT,
  city TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  is_default BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON user_addresses(user_id);

-- Cart items per user
CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id),
  name TEXT,
  price NUMERIC,
  quantity INTEGER,
  image TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_cart_user_product ON cart_items(user_id, product_id);

-- Link orders to users
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id);