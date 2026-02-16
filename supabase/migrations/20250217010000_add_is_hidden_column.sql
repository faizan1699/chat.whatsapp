-- Add is_hidden column to messages table
ALTER TABLE messages ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE;
