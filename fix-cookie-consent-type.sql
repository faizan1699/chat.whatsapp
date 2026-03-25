-- Fix cookie_consent column to be JSONB instead of BOOLEAN
-- Run this in Supabase SQL Editor

-- First, drop the conflicting column if it exists as BOOLEAN
ALTER TABLE users DROP COLUMN IF EXISTS cookie_consent;

-- Add it back as JSONB to match frontend expectations
ALTER TABLE users ADD COLUMN cookie_consent JSONB DEFAULT '{"essential":true,"analytics":false,"marketing":false,"functional":false}';

-- Update the timestamp column name to match
ALTER TABLE users DROP COLUMN IF EXISTS cookie_consent_at;
ALTER TABLE users ADD COLUMN cookie_consent_at TIMESTAMPTZ;

-- Verify the change
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'cookie_consent';
