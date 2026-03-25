-- Check what's actually stored for the test user
SELECT id, username, email, phone_number, created_at, updated_at, email_verified
FROM users 
WHERE username LIKE '%testuser%' 
ORDER BY created_at DESC 
LIMIT 5;
