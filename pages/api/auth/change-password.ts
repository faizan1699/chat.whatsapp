import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';
import bcrypt from 'bcryptjs';
import { getAuthUser } from '../../../utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const authUser = getAuthUser(req);
    if (!authUser) {
        return res.status(401).json({ error: 'Please login to change password' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'Current password and new password (min 6 chars) required' });
    }

    try {
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('password')
            .eq('id', authUser.userId)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await supabaseAdmin
            .from('users')
            .update({ password: hashedPassword })
            .eq('id', authUser.userId);

        return res.status(200).json({ message: 'Password changed successfully' });
    } catch (err) {
        console.error('Change password error:', err);
        return res.status(500).json({ error: 'Failed to change password' });
    }
}
