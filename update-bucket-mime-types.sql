-- Update bucket to allow more MIME types including octet-stream
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 
  'application/pdf', 'text/plain', 
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream'
]
WHERE id = 'chat-files';
