import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const uploadAudio = async (blob: Blob, fileName: string) => {
    const { data, error } = await supabase.storage
        .from('audio-messages')
        .upload(`${fileName}.wav`, blob, {
            contentType: 'audio/wav',
        });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from('audio-messages')
        .getPublicUrl(data.path);

    return publicUrl;
};
