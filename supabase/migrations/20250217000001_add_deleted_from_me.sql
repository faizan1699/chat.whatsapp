-- Add is_deleted_from_me column to messages table
-- This will track which users have deleted a message for themselves

ALTER TABLE messages ADD COLUMN is_deleted_from_me JSONB DEFAULT '{}';

-- Create index for better performance
CREATE INDEX idx_messages_is_deleted_from_me ON messages USING GIN (is_deleted_from_me);

-- Add comment to explain the column
COMMENT ON COLUMN messages.is_deleted_from_me IS 'JSON object storing user IDs who have deleted this message for themselves. Format: {"userId1": true, "userId2": true}';
