-- Add hobbies column to users_meta table
ALTER TABLE users_meta ADD COLUMN IF NOT EXISTS hobbies TEXT DEFAULT '[]';

-- Create index for hobbies column (as text array)
CREATE INDEX IF NOT EXISTS idx_users_meta_hobbies ON users_meta (hobbies);

-- Update existing users to have empty hobbies array
UPDATE users_meta 
SET hobbies = '[]' 
WHERE hobbies IS NULL;
