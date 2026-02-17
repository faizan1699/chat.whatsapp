import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';
import { otpService } from '../../../services/otpService';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { email } = req.body;
    if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', email.trim())
            .single();

        if (error || !user) {
            // Don't reveal if email exists
            return res.status(200).json({
                message: 'If an account exists with this email, you will receive a password reset link.',
            });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await supabaseAdmin
            .from('users')
            .update({
                reset_token: resetToken,
                reset_token_expires: expiresAt.toISOString(),
            })
            .eq('id', user.id);

        await otpService.sendPasswordResetLink(email.trim(), resetToken);

        return res.status(200).json({
            message: 'If an account exists with this email, you will receive a password reset link.',
        });
    } catch (err) {
        console.error('Forgot password error:', err);
        return res.status(500).json({ error: 'Failed to process request' });
    }
}
