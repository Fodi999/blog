-- Downloads of library files: one row per file, a counter, no personal data.
CREATE TABLE IF NOT EXISTS downloads (
  key        TEXT PRIMARY KEY,         -- R2 key, e.g. downloads/bolt-iso-4017/m12-x-60/bolt-iso-4017-m12-x-60.step
  count      INTEGER NOT NULL DEFAULT 0,
  last_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
