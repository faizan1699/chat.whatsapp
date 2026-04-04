-- Add is_hidden column for "delete for everyone" functionality
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_is_hidden ON messages(is_hidden);
