-- Add hide_from_all column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS hide_from_all BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_hide_from_all ON messages(hide_from_all);
