ALTER TABLE users_meta ADD COLUMN IF NOT EXISTS hobbies TEXT DEFAULT '[]';
CREATE INDEX IF NOT EXISTS idx_users_meta_hobbies ON users_meta (hobbies);
UPDATE users_meta SET hobbies = '[]' WHERE hobbies IS NULL;
