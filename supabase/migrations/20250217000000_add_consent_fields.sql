-- Add consent and legal fields to users table
ALTER TABLE users 
ADD COLUMN termsAccepted BOOLEAN DEFAULT FALSE,
ADD COLUMN termsAcceptedAt TIMESTAMP WITH TIME ZONE,
ADD COLUMN cookieConsent JSONB,
ADD COLUMN cookieConsentAt TIMESTAMP WITH TIME ZONE;

-- Add indexes for better query performance
CREATE INDEX idx_users_termsAccepted ON users(termsAccepted);
CREATE INDEX idx_users_cookieConsentAt ON users(cookieConsentAt);
