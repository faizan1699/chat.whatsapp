CREATE TABLE IF NOT EXISTS "UserHobby" (
    id TEXT NOT NULL PRIMARY KEY,
    userId TEXT NOT NULL,
    hobbyId TEXT NOT NULL,
    createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT user_hobby_user_id_fkey 
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT user_hobby_hobby_id_fkey 
        FOREIGN KEY (hobbyId) REFERENCES "Hobby" (id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "UserHobby_userId_idx" ON "UserHobby"("userId");
CREATE INDEX IF NOT EXISTS "UserHobby_hobbyId_idx" ON "UserHobby"("hobbyId");
CREATE UNIQUE INDEX IF NOT EXISTS "UserHobby_userId_hobbyId_key" ON "UserHobby"("userId", "hobbyId");

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'Hobby', 'UserHobby')
ORDER BY table_name, ordinal_position;;
