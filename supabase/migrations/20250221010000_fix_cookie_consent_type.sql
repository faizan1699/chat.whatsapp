-- Fix cookie_consent column type from BOOLEAN to JSONB
-- This migration fixes the conflict between consent field migrations

-- Drop the BOOLEAN column and recreate as JSONB
ALTER TABLE users DROP COLUMN IF EXISTS cookie_consent;
ALTER TABLE users ADD COLUMN cookie_consent JSONB DEFAULT '{"essential":true,"analytics":false,"marketing":false,"functional":false}';

-- Ensure timestamp column exists with correct naming
ALTER TABLE users DROP COLUMN IF EXISTS cookie_consent_at;
ALTER TABLE users ADD COLUMN cookie_consent_at TIMESTAMPTZ;
