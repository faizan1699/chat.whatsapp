-- Create UserHobby table if not exists
CREATE TABLE IF NOT EXISTS "UserHobby" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hobbyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserHobby_pkey" PRIMARY KEY ("id")
);

-- Create indexes for user hobbies
CREATE INDEX IF NOT EXISTS "UserHobby_userId_idx" ON "UserHobby"("userId");
CREATE INDEX IF NOT EXISTS "UserHobby_hobbyId_idx" ON "UserHobby"("hobbyId");

-- Create unique index to prevent duplicate user-hobby relationships
CREATE UNIQUE INDEX IF NOT EXISTS "UserHobby_userId_hobbyId_key" ON "UserHobby"("userId", "hobbyId");

-- Add foreign key constraints
ALTER TABLE "UserHobby" ADD CONSTRAINT "UserHobby_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserHobby" ADD CONSTRAINT "UserHobby_hobbyId_fkey" FOREIGN KEY ("hobbyId") REFERENCES "Hobby"("id") ON DELETE CASCADE ON UPDATE CASCADE;
