-- Monge site: library catalogue + leads (Cloudflare D1, SQLite)

CREATE TABLE IF NOT EXISTS items (
  slug       TEXT PRIMARY KEY,
  category   TEXT NOT NULL,
  data       TEXT NOT NULL,            -- JSON of LibraryItem (lib/library.ts)
  published  INTEGER NOT NULL DEFAULT 1,
  sort       INTEGER NOT NULL DEFAULT 100,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS items_published ON items (published, sort);

CREATE TABLE IF NOT EXISTS leads (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  kind       TEXT NOT NULL,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  company    TEXT,
  message    TEXT,
  context    TEXT,
  locale     TEXT,
  country    TEXT,
  user_agent TEXT,
  status     TEXT NOT NULL DEFAULT 'new'
);
CREATE INDEX IF NOT EXISTS leads_created ON leads (created_at);
CREATE INDEX IF NOT EXISTS leads_email ON leads (email);
