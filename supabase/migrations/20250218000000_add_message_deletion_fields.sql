-- Add message deletion fields
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_by TEXT REFERENCES users(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_deleted_from_me JSONB DEFAULT '[]';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_deleted_by ON messages(deleted_by);
CREATE INDEX IF NOT EXISTS idx_messages_is_deleted_from_me ON messages USING GIN(is_deleted_from_me);
