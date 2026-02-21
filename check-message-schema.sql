-- Check current message table schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name IN ('isedited', 'is_edited', 'ispinned', 'is_pinned', 'isdeleted', 'is_deleted', 'editedat', 'editedAt')
ORDER BY column_name;
