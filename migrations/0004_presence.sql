-- Who is on the site now: a random number an open page made for itself (in its memory only — no cookie, nothing kept
-- on the device, no IP), and when it last said it is open. Rows older than 5 minutes are removed as they come.
CREATE TABLE IF NOT EXISTS presence (
  id   TEXT PRIMARY KEY,
  seen INTEGER NOT NULL            -- unix seconds
);
CREATE INDEX IF NOT EXISTS presence_seen ON presence (seen);
