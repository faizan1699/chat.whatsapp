import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';
import { createSession } from '../../../lib/auth-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
    }

    try {
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('id, username, verification_otp, verification_otp_expires')
            .eq('email', email.trim())
            .single();

        if (error || !user) {
            return res.status(400).json({ error: 'Invalid email or OTP' });
        }

        if (!user.verification_otp || user.verification_otp !== otp.toString().trim()) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        if (!user.verification_otp_expires || new Date(user.verification_otp_expires) < new Date()) {
            return res.status(400).json({ error: 'OTP has expired' });
        }

        await supabaseAdmin
            .from('users')
            .update({
                email_verified: true,
                verification_otp: null,
                verification_otp_expires: null,
            })
            .eq('id', user.id);

        // Auto-login after successful verification
        const sessionData = await createSession(user.id, user.username, res);

        return res.status(200).json({ 
            message: 'Email verified successfully',
            user: { id: user.id, username: user.username },
            accessToken: sessionData.accessToken,
            refreshToken: sessionData.refreshToken
        });
    } catch (err) {
        console.error('Verify email error:', err);
        return res.status(500).json({ error: 'Failed to verify email' });
    }
}
