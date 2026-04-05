-- Create users_meta table for Supabase
CREATE TABLE IF NOT EXISTS users_meta (
    id TEXT PRIMARY KEY DEFAULT (uuid_generate_v4()),
    user_id TEXT NOT NULL UNIQUE,
    bio TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- Foreign key constraint to users table
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_meta_user_id ON users_meta(user_id);

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_meta_updated_at 
    BEFORE UPDATE ON public.users_meta 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security (RLS) for Supabase
ALTER TABLE public.users_meta ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own meta data
CREATE POLICY "Users can view own meta data" ON public.users_meta
    FOR SELECT USING (auth.uid()::text = user_id);

-- Create policy to allow users to update their own meta data
CREATE POLICY "Users can update own meta data" ON public.users_meta
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Create policy to allow users to insert their own meta data
CREATE POLICY "Users can insert own meta data" ON public.users_meta
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);