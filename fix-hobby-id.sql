-- Fix Hobby table to auto-generate UUID for id column
-- This will be run manually to fix the issue

-- Drop and recreate the Hobby table with proper UUID generation
DROP TABLE IF EXISTS "Hobby" CASCADE;

CREATE TABLE "Hobby" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hobby_pkey" PRIMARY KEY ("id")
);

-- Create unique index for hobby names
CREATE UNIQUE INDEX "Hobby_name_key" ON "Hobby"("name");

-- Drop and recreate UserHobby table with proper UUID generation
DROP TABLE IF EXISTS "UserHobby" CASCADE;

CREATE TABLE "UserHobby" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "hobbyId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserHobby_pkey" PRIMARY KEY ("id")
);

-- Create indexes for user hobbies
CREATE INDEX "UserHobby_userId_idx" ON "UserHobby"("userId");
CREATE INDEX "UserHobby_hobbyId_idx" ON "UserHobby"("hobbyId");

-- Create unique index to prevent duplicate user-hobby relationships
CREATE UNIQUE INDEX "UserHobby_userId_hobbyId_key" ON "UserHobby"("userId", "hobbyId");

-- Add foreign key constraints
ALTER TABLE "UserHobby" ADD CONSTRAINT "UserHobby_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserHobby" ADD CONSTRAINT "UserHobby_hobbyId_fkey" FOREIGN KEY ("hobbyId") REFERENCES "Hobby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert default hobbies
INSERT INTO "Hobby" (name) VALUES 
('reading'),
('writing'),
('coding'),
('gaming'),
('cooking'),
('traveling'),
('photography'),
('music'),
('sports'),
('art'),
('dancing'),
('movies'),
('fitness'),
('camping'),
('football'),
('basketball'),
('badminton'),
('baking'),
('board games'),
('animation'),
('anime');
