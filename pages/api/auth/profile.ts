import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';
import { getAuthUser } from '../../../utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authUser = getAuthUser(req);
    if (!authUser) {
        return res.status(401).json({ error: 'Please login' });
    }

    if (req.method === 'GET') {
        try {
            const { data, error } = await supabaseAdmin
                .from('users')
                .select('id, username, email, phone_number, avatar')
                .eq('id', authUser.userId)
                .single();

            if (error || !data) return res.status(404).json({ error: 'User not found' });

            return res.status(200).json({
                id: data.id,
                username: data.username,
                email: data.email,
                phoneNumber: data.phone_number,
                avatar: data.avatar,
            });
        } catch (err) {
            return res.status(500).json({ error: 'Failed to fetch profile' });
        }
    }

    if (req.method === 'PATCH') {
        const { username, avatar } = req.body;
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (typeof username === 'string' && username.length >= 2) updates.username = username;
        if (typeof avatar === 'string') updates.avatar = avatar;

        if (Object.keys(updates).length <= 1) {
            return res.status(400).json({ error: 'Nothing to update' });
        }

        try {
            const { data, error } = await supabaseAdmin
                .from('users')
                .update(updates)
                .eq('id', authUser.userId)
                .select('id, username, avatar')
                .single();

            if (error) {
                if (error.code === '23505') return res.status(400).json({ error: 'Username already taken' });
                throw error;
            }
            return res.status(200).json(data);
        } catch (err) {
            return res.status(500).json({ error: 'Failed to update profile' });
        }
    }

    return res.status(405).json({ message: 'Method not allowed' });
}
