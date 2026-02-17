-- Schema initialization for Bazaarly backend

CREATE TABLE IF NOT EXISTS merchants (
  id TEXT PRIMARY KEY,
  company_name TEXT,
  owner_name TEXT,
  email TEXT,
  phone TEXT,
  tax_id TEXT,
  store_status TEXT,
  joined_date TIMESTAMPTZ,
  banners JSONB,
  description TEXT,
  store_policy TEXT,
  location TEXT
);

CREATE TABLE IF NOT EXISTS promotions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  discount_percentage NUMERIC,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT,
  type TEXT,
  min_purchase NUMERIC,
  merchant_id TEXT REFERENCES merchants(id)
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  price NUMERIC NOT NULL,
  old_price NUMERIC,
  rating NUMERIC,
  reviews INTEGER,
  image TEXT,
  images JSONB,
  is_express BOOLEAN,
  category TEXT,
  sub_category TEXT,
  badge TEXT,
  specs JSONB,
  merchant_id TEXT REFERENCES merchants(id),
  made_in TEXT,
  warranty_detail TEXT,
  delivery_time TEXT,
  delivery_area TEXT,
  bulk_min_qty INTEGER,
  bulk_price NUMERIC
);

CREATE TABLE IF NOT EXISTS ad_inquiries (
  id TEXT PRIMARY KEY,
  company_name TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  budget TEXT,
  ad_type TEXT,
  target_category TEXT,
  status TEXT,
  date DATE
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  date TIMESTAMPTZ DEFAULT NOW(),
  total NUMERIC,
  status TEXT,
  address TEXT,
  payment_method TEXT,
  is_tax_invoice BOOLEAN DEFAULT FALSE,
  ntn TEXT
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id),
  name TEXT,
  price NUMERIC,
  quantity INTEGER,
  image TEXT
);