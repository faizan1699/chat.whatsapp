-- Add editedAt column to messages table for edit tracking
ALTER TABLE messages ADD COLUMN IF NOT EXISTS editedAt TIMESTAMPTZ DEFAULT NULL;
