-- Baloch Sahab Automation - TikTok Login + publishing backend
-- D1 schema. Tokens are never stored in plaintext; the session cookie is an
-- opaque server-resolved id and never carries token material.

CREATE TABLE users (
  id                          TEXT PRIMARY KEY,
  tiktok_open_id              TEXT NOT NULL UNIQUE,
  display_name                TEXT,
  avatar_url                  TEXT,
  access_token_enc            TEXT NOT NULL,
  access_token_iv              TEXT NOT NULL,
  refresh_token_enc            TEXT NOT NULL,
  refresh_token_iv              TEXT NOT NULL,
  access_token_expires_at       INTEGER NOT NULL,
  refresh_token_expires_at       INTEGER NOT NULL,
  scope                          TEXT NOT NULL,
  created_at                     INTEGER NOT NULL,
  updated_at                     INTEGER NOT NULL
);

CREATE TABLE sessions (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    INTEGER NOT NULL,
  expires_at    INTEGER NOT NULL,
  user_agent    TEXT,
  ip_hash       TEXT
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);

CREATE TABLE oauth_state (
  state           TEXT PRIMARY KEY,
  code_verifier   TEXT NOT NULL,
  created_at      INTEGER NOT NULL,
  expires_at      INTEGER NOT NULL
);

CREATE INDEX idx_oauth_state_expires_at ON oauth_state(expires_at);

CREATE TABLE posts (
  id                   TEXT PRIMARY KEY,
  user_id              TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  caption              TEXT NOT NULL,
  hashtags             TEXT NOT NULL DEFAULT '[]',
  media_key            TEXT NOT NULL,
  video_url            TEXT NOT NULL,
  privacy_level        TEXT NOT NULL,
  disable_duet         INTEGER NOT NULL DEFAULT 0,
  disable_comment      INTEGER NOT NULL DEFAULT 0,
  disable_stitch       INTEGER NOT NULL DEFAULT 0,
  is_aigc              INTEGER NOT NULL DEFAULT 0,
  is_branded_content   INTEGER NOT NULL DEFAULT 0,
  publish_target       TEXT NOT NULL DEFAULT 'inbox',
  status               TEXT NOT NULL DEFAULT 'draft',
  scheduled_at         INTEGER,
  tiktok_publish_id    TEXT,
  error_message        TEXT,
  created_at           INTEGER NOT NULL,
  updated_at           INTEGER NOT NULL
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status_scheduled_at ON posts(status, scheduled_at);
