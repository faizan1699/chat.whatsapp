import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';
import { otpService } from '../../../services/otpService';

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
            return res.status(400).json({ error: 'No account found with this email' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

        await supabaseAdmin
            .from('users')
            .update({
                verification_otp: otp,
                verification_otp_expires: expiresAt.toISOString(),
            })
            .eq('id', user.id);

        await otpService.sendOTP(email.trim(), otp);

        return res.status(200).json({ message: 'Verification code sent to your email' });
    } catch (err) {
        console.error('Resend OTP error:', err);
        return res.status(500).json({ error: 'Failed to send OTP' });
    }
}
