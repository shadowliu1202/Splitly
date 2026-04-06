-- Add is_virtual flag to users table.
-- Virtual members are placeholder members without a LINE account.
-- They can be created in a group and later claimed by a real LINE user.
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_virtual BOOLEAN NOT NULL DEFAULT FALSE;
