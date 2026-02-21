-- Add password reset fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_reset_otp TEXT,
ADD COLUMN IF NOT EXISTS password_reset_otp_expiry TIMESTAMPTZ;
