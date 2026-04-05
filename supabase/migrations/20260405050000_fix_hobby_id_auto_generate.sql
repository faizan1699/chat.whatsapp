-- Fix Hobby table to auto-generate UUID for id column
-- First drop the primary key constraint
ALTER TABLE "Hobby" DROP CONSTRAINT "Hobby_pkey";

-- Alter the id column to have a default UUID value
ALTER TABLE "Hobby" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- Recreate the primary key constraint
ALTER TABLE "Hobby" ADD CONSTRAINT "Hobby_pkey" PRIMARY KEY ("id");

-- Fix UserHobby table as well
ALTER TABLE "UserHobby" DROP CONSTRAINT "UserHobby_pkey";
ALTER TABLE "UserHobby" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "UserHobby" ADD CONSTRAINT "UserHobby_pkey" PRIMARY KEY ("id");
