-- Allow Google-only users (no LINE account)
ALTER TABLE users ALTER COLUMN line_user_id DROP NOT NULL;

-- Google user identifier
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_user_id TEXT UNIQUE;
