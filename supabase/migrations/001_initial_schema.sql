-- ─────────────────────────────────────────────────────────────────────────────
-- Splitly – Initial Schema
-- Run via: supabase db push  (or paste into Supabase SQL Editor)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  line_user_id  TEXT        UNIQUE NOT NULL,
  display_name  TEXT        NOT NULL,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Groups ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS groups (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT        NOT NULL,
  invite_code  TEXT        UNIQUE NOT NULL,
  created_by   UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Group Members ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_members (
  group_id   UUID        REFERENCES groups(id) ON DELETE CASCADE,
  user_id    UUID        REFERENCES users(id)  ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- ── Expenses ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id    UUID         REFERENCES groups(id)  ON DELETE CASCADE NOT NULL,
  paid_by     UUID         REFERENCES users(id)   ON DELETE SET NULL NOT NULL,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  description TEXT         NOT NULL,
  split_type  TEXT         NOT NULL DEFAULT 'equal'
                           CHECK (split_type IN ('equal', 'custom', 'percentage')),
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ── Expense Splits ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense_splits (
  expense_id  UUID         REFERENCES expenses(id) ON DELETE CASCADE,
  user_id     UUID         REFERENCES users(id)    ON DELETE CASCADE,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  PRIMARY KEY (expense_id, user_id)
);

-- ── Settlements ───────────────────────────────────────────────────────────────
-- Records actual money transfers between members (debtor → creditor).
CREATE TABLE IF NOT EXISTS settlements (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id      UUID         REFERENCES groups(id)  ON DELETE CASCADE NOT NULL,
  from_user_id  UUID         REFERENCES users(id)   ON DELETE CASCADE NOT NULL,
  to_user_id    UUID         REFERENCES users(id)   ON DELETE CASCADE NOT NULL,
  amount        NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  settled_at    TIMESTAMPTZ  DEFAULT NOW(),
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_group_members_user_id   ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group_id       ON expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense  ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_settlements_group_id    ON settlements(group_id);

-- ── Row Level Security ────────────────────────────────────────────────────────
-- We use service-role key server-side, so RLS is permissive for now.
-- Tighten these policies once you add Supabase Auth / JWT integration.
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups       ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements  ENABLE ROW LEVEL SECURITY;

-- Permissive read/write (service role bypasses RLS anyway)
CREATE POLICY "allow_all" ON users         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON groups        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON group_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON expenses      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON expense_splits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON settlements   FOR ALL USING (true) WITH CHECK (true);
