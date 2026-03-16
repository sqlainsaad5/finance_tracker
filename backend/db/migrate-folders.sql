-- Migration: add folders and transactions.folder_id
-- Run if you already have the DB: psql $DATABASE_URL -f server/db/migrate-folders.sql

CREATE TABLE IF NOT EXISTS folders (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);

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
