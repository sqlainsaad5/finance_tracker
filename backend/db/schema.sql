-- Finance Tracker schema (PostgreSQL)
-- Run once: npm run db:setup (or psql $DATABASE_URL -f db/schema.sql)

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'PKR',
  theme         TEXT NOT NULL DEFAULT 'light',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,
  icon        TEXT DEFAULT '💰',
  user_id     TEXT REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT type_check CHECK (type IN ('income', 'expense'))
);

CREATE TABLE IF NOT EXISTS transactions (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id    TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  amount         NUMERIC(12, 2) NOT NULL,
  type           TEXT NOT NULL,
  date           TIMESTAMPTZ NOT NULL,
  note           TEXT,
  payment_method TEXT DEFAULT 'Other',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT transaction_type_check CHECK (type IN ('income', 'expense'))
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, type);

CREATE TABLE IF NOT EXISTS folders (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);

-- Add folder_id to transactions (run migration if table already exists without it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_transactions_user_folder ON transactions(user_id, folder_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS budgets (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount      NUMERIC(12, 2) NOT NULL,
  month       INT NOT NULL,
  year        INT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category_id, month, year)
);
