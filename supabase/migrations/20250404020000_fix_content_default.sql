-- Fix content column default value issue
-- Remove DEFAULT '' to prevent empty strings when deleting messages

ALTER TABLE messages ALTER COLUMN content DROP DEFAULT;
ALTER TABLE messages ALTER COLUMN content SET NOT NULL;

-- Update any existing empty content to proper placeholder
UPDATE messages 
SET content = '[This message was deleted]' 
WHERE content = '' AND is_deleted = true;
