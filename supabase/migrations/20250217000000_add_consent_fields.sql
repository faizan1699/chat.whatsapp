-- Add consent and legal fields to users table
ALTER TABLE users 
ADD COLUMN terms_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN terms_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN cookie_consent JSONB,
ADD COLUMN cookie_consent_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for better query performance
CREATE INDEX idx_users_terms_accepted ON users(terms_accepted);
CREATE INDEX idx_users_cookie_consent_at ON users(cookie_consent_at);
