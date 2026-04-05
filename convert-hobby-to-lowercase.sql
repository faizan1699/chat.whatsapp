-- Convert Hobby table to lowercase 'hobby'
-- Run this in your Supabase SQL Editor

-- 1. Create the new lowercase hobby table
CREATE TABLE IF NOT EXISTS "hobby" (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create unique index for hobby names
CREATE UNIQUE INDEX IF NOT EXISTS "hobby_name_key" ON "hobby"("name");

-- 3. Copy data from uppercase to lowercase table
INSERT INTO "hobby" (id, name, createdAt, updatedAt)
SELECT id, name, "createdAt", "updatedAt"
FROM "Hobby"
ON CONFLICT (id) DO NOTHING;

-- 4. Update UserHobby foreign key to point to lowercase table (if UserHobby exists)
-- Drop existing foreign key if it exists
-- ALTER TABLE "UserHobby" DROP CONSTRAINT IF EXISTS user_hobby_hobby_id_fkey;

-- Add new foreign key pointing to lowercase table
-- ALTER TABLE "UserHobby" 
-- ADD CONSTRAINT user_hobby_hobby_id_fkey 
-- FOREIGN KEY (hobbyId) REFERENCES "hobby" (id) ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Drop the old uppercase table (AFTER verifying data is copied)
-- DROP TABLE IF EXISTS "Hobby" CASCADE;

-- 6. Verify the data
SELECT COUNT(*) as hobby_count FROM "hobby";
SELECT * FROM "hobby" LIMIT 5;
