-- Fix message column names and add editedAt column
-- This migration ensures consistent naming between frontend and backend

-- Update messages table column names to match frontend
ALTER TABLE messages RENAME COLUMN IF EXISTS is_edited TO isEdited;
ALTER TABLE messages RENAME COLUMN IF EXISTS is_pinned TO isPinned;
ALTER TABLE messages RENAME COLUMN IF EXISTS is_deleted TO isDeleted;

-- Add editedAt column if it doesn't exist
ALTER TABLE messages ADD COLUMN IF NOT EXISTS editedAt TIMESTAMPTZ;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_isEdited ON messages(isEdited);
CREATE INDEX IF NOT EXISTS idx_messages_isPinned ON messages(isPinned);
CREATE INDEX IF NOT EXISTS idx_messages_isDeleted ON messages(isDeleted);
