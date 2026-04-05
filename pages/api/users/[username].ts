import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { username } = req.query;

    if (!username || typeof username !== 'string') {
        return res.status(400).json({ error: 'Username parameter required' });
    }

    try {
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('id, username, email, phone_number, avatar, created_at, last_seen')
            .eq('username', username)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get user bio from users_meta table
        const { data: meta_data, error: metaError } = await supabaseAdmin
            .from('users_meta')
            .select('bio, hobbies')
            .eq('user_id', user.id)
            .single();

        const bio = metaError ? '' : (meta_data?.bio || '');

        // Get user hobbies from hobbies array in users_meta
        let hobbies: any[] = [];
        if (meta_data && meta_data.hobbies && Array.isArray(meta_data.hobbies) && meta_data.hobbies.length > 0) {
            const { data: hobbiesData } = await supabaseAdmin
                .from('hobby')
                .select('id, name')
                .in('id', meta_data.hobbies);
            
            hobbies = hobbiesData || [];
        }

        return res.status(200).json({
            id: user.id,
            username: user.username,
            email: user.email,
            phone: user.phone_number,
            avatar: user.avatar,
            bio: bio,
            hobbies: hobbies,
            createdAt: user.created_at,
            lastSeen: user.last_seen
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
