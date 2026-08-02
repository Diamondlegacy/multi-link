-- FRESH REBUILD: this version uses email (not username) to log in,
-- and adds a profile picture field.
--
-- If you already have data you care about, back it up first.
-- Otherwise, in Vercel's Query tab, run this to wipe and start clean:
--   DROP TABLE IF EXISTS hours_entries;
--   DROP TABLE IF EXISTS users;
--   DROP TABLE IF EXISTS settings;
-- Then run everything below.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'worker', -- 'admin' or 'worker'
  full_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  dob DATE,
  avatar_url TEXT DEFAULT '', -- base64 data URL of the profile picture
  bank_name TEXT DEFAULT '',
  bank_account_name TEXT DEFAULT '',
  bank_account_number_encrypted TEXT DEFAULT '', -- encrypted, never plain text
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hours_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  hours NUMERIC(6,2) NOT NULL,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO settings (key, value) VALUES ('pay_rate', '0')
ON CONFLICT (key) DO NOTHING;
