-- Add columns for proper message deletion functionality
ALTER TABLE messages 
ADD COLUMN "deletedBy" TEXT,
ADD COLUMN "hiddenBy" JSONB;
