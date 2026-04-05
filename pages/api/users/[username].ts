import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';
import { authenticate } from '../../../utils/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // const session = await authenticate(req);
    // if (!session) {
    //     return res.status(401).json({ error: 'Unauthorized' });
    // }

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

        const { data: meta_data, error: metaError } = await supabaseAdmin
            .from('users_meta')
            .select('*')
            .eq('user_id', user.id)
            .single();

        const bio = metaError ? '' : (meta_data?.bio || '');
        const meta: any = metaError ? {} : (meta_data || {});
        
        let hobbyIds: string[] = [];
        if (meta.hobbies) {
            try {
                if (typeof meta.hobbies === 'string') {
                    hobbyIds = JSON.parse(meta.hobbies);
                } else if (Array.isArray(meta.hobbies)) {
                    hobbyIds = meta.hobbies;
                }
            } catch (err) {
                hobbyIds = [];
            }
        }
        
        delete meta.hobbies;

        let hobbiesWithNames: any[] = [];
        if (hobbyIds.length > 0) {
            try {
                const { data: hobbiesData } = await supabaseAdmin
                    .from('hobby')
                    .select('id, name')
                    .in('id', hobbyIds);

                hobbiesWithNames = hobbiesData || [];
            } catch (err) {
                console.error('Error fetching hobby details:', err);
            }
        }


        return res.status(200).json({
            id: user.id,
            username: user.username,
            email: user.email,
            phone: user.phone_number,
            avatar: user.avatar,
            bio: bio,
            hobbies: hobbiesWithNames,
            createdAt: user.created_at,
            lastSeen: user.last_seen,
            ...meta
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
