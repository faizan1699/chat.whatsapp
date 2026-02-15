import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'Invalid token or password (min 6 characters)' });
    }

    try {
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('reset_token', token)
            .not('reset_token_expires', 'is', null)
            .single();

        if (error || !user) {
            return res.status(400).json({ error: 'Invalid or expired reset link' });
        }

        const { data: fullUser } = await supabaseAdmin
            .from('users')
            .select('reset_token_expires')
            .eq('id', user.id)
            .single();

        if (!fullUser?.reset_token_expires || new Date(fullUser.reset_token_expires) < new Date()) {
            return res.status(400).json({ error: 'Reset link has expired' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await supabaseAdmin
            .from('users')
            .update({
                password: hashedPassword,
                reset_token: null,
                reset_token_expires: null,
            })
            .eq('id', user.id);

        return res.status(200).json({ message: 'Password reset successfully. You can now login.' });
    } catch (err) {
        console.error('Reset password error:', err);
        return res.status(500).json({ error: 'Failed to reset password' });
    }
}
