-- Alter table to add is_deleted_from_me field
-- This migration adds the is_deleted_from_me JSONB field to the messages table

-- Add the new column
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_deleted_from_me JSONB DEFAULT '[]';

-- Create index for better performance on the new field
CREATE INDEX IF NOT EXISTS idx_messages_is_deleted_from_me ON messages USING GIN (is_deleted_from_me);
