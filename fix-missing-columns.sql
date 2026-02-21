-- ============================================================
-- Fix Missing Columns Migration
-- Run this in Supabase SQL Editor to add missing columns
-- ============================================================

-- Add missing consent and email verification columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cookie_consent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cookie_consent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_otp TEXT,
ADD COLUMN IF NOT EXISTS email_otp_expiry TIMESTAMPTZ;

-- Create trigger function for auto-updating updated_at (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table (drop existing if any)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('cookie_consent', 'terms_accepted', 'email_verified', 'email_otp');
