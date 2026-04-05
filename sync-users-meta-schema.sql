-- ENSURE users_meta TABLE EXISTS AND HAS ALL REQUIRED COLUMNS
CREATE TABLE IF NOT EXISTS "users_meta" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" TEXT UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "bio" TEXT DEFAULT '',
    "dateOfBirth" DATE,
    "fatherName" TEXT,
    "address" TEXT,
    "cnic" TEXT UNIQUE,
    "gender" TEXT,
    "hobbies" TEXT[] DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ADD COLUMNS INDIVIDUALLY IN CASE TABLE ALREADY EXISTS
DO $$
BEGIN
    -- user_id (checking for existing userId and renaming if found)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users_meta' AND column_name='userId') THEN
        ALTER TABLE "users_meta" RENAME COLUMN "userId" TO "user_id";
    END IF;

    -- bio
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users_meta' AND column_name='bio') THEN
        ALTER TABLE "users_meta" ADD COLUMN "bio" TEXT DEFAULT '';
    END IF;

    -- dateOfBirth
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users_meta' AND column_name='dateOfBirth') THEN
        ALTER TABLE "users_meta" ADD COLUMN "dateOfBirth" TIMESTAMP(3);
    END IF;

    -- fatherName
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users_meta' AND column_name='fatherName') THEN
        ALTER TABLE "users_meta" ADD COLUMN "fatherName" TEXT;
    END IF;

    -- address
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users_meta' AND column_name='address') THEN
        ALTER TABLE "users_meta" ADD COLUMN "address" TEXT;
    END IF;

    -- cnic
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users_meta' AND column_name='cnic') THEN
        ALTER TABLE "users_meta" ADD COLUMN "cnic" TEXT;
        ALTER TABLE "users_meta" ADD CONSTRAINT "users_meta_cnic_key" UNIQUE ("cnic");
    END IF;

    -- gender
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users_meta' AND column_name='gender') THEN
        ALTER TABLE "users_meta" ADD COLUMN "gender" TEXT;
    END IF;

    -- hobbies
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users_meta' AND column_name='hobbies') THEN
        ALTER TABLE "users_meta" ADD COLUMN "hobbies" TEXT[] DEFAULT '{}';
    END IF;

END $$;
