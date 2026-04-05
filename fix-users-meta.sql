-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_users_meta_updated_at ON public.users_meta;

-- Add missing columns if they don't exist
ALTER TABLE users_meta ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE users_meta ADD COLUMN IF NOT EXISTS dateOfBirth TEXT;
ALTER TABLE users_meta ADD COLUMN IF NOT EXISTS fatherName TEXT;
ALTER TABLE users_meta ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users_meta ADD COLUMN IF NOT EXISTS cnic TEXT;
ALTER TABLE users_meta ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE users_meta ADD COLUMN IF NOT EXISTS hobbies TEXT DEFAULT '[]';

-- Recreate the trigger
CREATE TRIGGER update_users_meta_updated_at 
    BEFORE UPDATE ON public.users_meta 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();
