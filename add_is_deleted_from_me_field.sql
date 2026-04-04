-- Add is_deleted_from_me field to messages table
-- Run this in Supabase Dashboard > SQL Editor

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_deleted_from_me JSONB DEFAULT '[]';

-- Verify the field was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name = 'is_deleted_from_me';
