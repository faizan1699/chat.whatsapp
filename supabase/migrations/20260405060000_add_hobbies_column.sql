-- Add hobbies column to users_meta table
-- Run this in your Supabase SQL Editor

ALTER TABLE users_meta ADD COLUMN IF NOT EXISTS hobbies TEXT[] DEFAULT '{}';

-- Update the table to include hobbies array
-- This will store hobby IDs as an array in the user's metadata
