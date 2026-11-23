-- Test downloads: from preview addresses and localhost (they share production's D1). Kept apart from `downloads` so the
-- site's counters show only real visitors; the host says which preview it was. No personal data.
CREATE TABLE IF NOT EXISTS downloads_test (
  key        TEXT NOT NULL,             -- R2 key
  host       TEXT NOT NULL,             -- e.g. textures-test-blog.fodi85999.workers.dev, localhost
  count      INTEGER NOT NULL DEFAULT 0,
  last_at    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (key, host)
);
