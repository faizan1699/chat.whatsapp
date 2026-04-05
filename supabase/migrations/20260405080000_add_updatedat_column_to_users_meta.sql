-- Add updatedAt column to users_meta table to match API code
ALTER TABLE public.users_meta ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Update the existing trigger to also update the updatedAt column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    NEW.updatedAt = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';
