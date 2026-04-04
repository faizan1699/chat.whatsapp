-- Create audio-messages storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('audio-messages', 'audio-messages', true, 10485760, ARRAY['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/webm'])
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for audio-messages bucket
-- Allow users to upload their own audio files
CREATE POLICY "Users can upload their own audio files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'audio-messages' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow users to view their own audio files
CREATE POLICY "Users can view their own audio files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'audio-messages' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow users to update their own audio files
CREATE POLICY "Users can update their own audio files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'audio-messages' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow users to delete their own audio files
CREATE POLICY "Users can delete their own audio files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'audio-messages' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
