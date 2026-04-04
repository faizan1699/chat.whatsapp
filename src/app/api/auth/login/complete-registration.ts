import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { username, email, avatar } = req.body;

        if (!username || !email) {
            return res.status(400).json({ message: 'Username and email are required' });
        }

        // Update user with avatar
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .update({
                avatar: avatar || null,
            })
            .eq('username', username)
            .eq('email', email)
            .select('id, username, email, phone_number, avatar')
            .single();

        if (error || !user) {
            return res.status(500).json({ message: 'Failed to complete registration' });
        }

        return res.status(200).json({
            message: 'Registration completed successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                phone: user.phone_number,
                avatar: user.avatar,
            }
        });

    } catch (error: unknown) {
        console.error('Complete registration error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
