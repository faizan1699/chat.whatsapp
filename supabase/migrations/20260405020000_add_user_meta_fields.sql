-- Add new fields to UserMeta table
ALTER TABLE "UserMeta" 
ADD COLUMN "dateOfBirth" DATE,
ADD COLUMN "fatherName" VARCHAR(255),
ADD COLUMN "address" TEXT,
ADD COLUMN "cnic" VARCHAR(15) UNIQUE,  -- CNIC format: XXXXX-XXXXXXX-X
ADD COLUMN "gender" VARCHAR(10) CHECK ("gender" IN ('male', 'female', 'other'));

-- Add index for CNIC for faster lookups and uniqueness enforcement
CREATE UNIQUE INDEX "UserMeta_cnic_key" ON "UserMeta"("cnic") WHERE "cnic" IS NOT NULL;
