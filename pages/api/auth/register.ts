import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';
import bcrypt from 'bcryptjs';
import { otpService } from '../../../services/otpService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    const { username, email, phoneNumber, password } = req.body;

    if (!username || !password || (!email && !phoneNumber)) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedPassword = await bcrypt.hash(password, 10);

        const { data: user, error } = await supabaseAdmin
            .from('users')
            .insert({
                username,
                email: email || null,
                phone_number: phoneNumber || null,
                password: hashedPassword,
            })
            .select('id')
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(400).json({ error: 'Username, email or phone already exists' });
            }
            throw error;
        }

        // OTP via Email (FREE - Gmail)
        if (email) {
            await otpService.sendOTP(email, otp);
        }

        res.status(201).json({
            message: 'Registration successful. OTP sent to your email (if provided).',
            userId: user?.id
        });
    } catch (error: unknown) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
