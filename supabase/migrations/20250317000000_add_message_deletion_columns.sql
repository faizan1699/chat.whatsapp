-- Add columns for proper message deletion functionality
ALTER TABLE "Message" 
ADD COLUMN "deletedBy" TEXT,
ADD COLUMN "hiddenBy" JSONB;
