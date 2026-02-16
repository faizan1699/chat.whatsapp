import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_dont_use_in_production';

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

        // Update user verification status
        await supabaseAdmin
            .from('users')
            .update({
                email_verified: true,
                verification_otp: null,
                verification_otp_expires: null,
            })
            .eq('id', user.id);

        // Auto-login after successful verification
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set secure cookies for automatic login
        const cookies = [
            serialize('auth-token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7,
                path: '/',
            }),
            serialize('user-id', user.id, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7,
                path: '/',
            }),
            serialize('username', user.username, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7,
                path: '/',
            })
        ];

        res.setHeader('Set-Cookie', cookies);
        return res.status(200).json({ 
            message: 'Email verified successfully',
            user: { id: user.id, username: user.username }
        });
    } catch (err) {
        console.error('Verify email error:', err);
        return res.status(500).json({ error: 'Failed to verify email' });
    }
}
