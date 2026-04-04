import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';
import bcrypt from 'bcryptjs';
import { otpService } from '../../../services/otpService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    const { username, email, phoneNumber, password, termsAccepted, cookieConsent } = req.body;

    if (!username || !password || (!email && !phoneNumber)) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // if (!termsAccepted) {
    //     return res.status(400).json({ error: 'Terms and conditions must be accepted' });
    // }

    try {
        // Check if username, email, or phone already exists
        const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('id, username, email, phone_number')
            .or(`username.eq.${username},email.eq.${email},phone_number.eq.${phoneNumber}`)
            .limit(1);

        if (existingUser && existingUser.length > 0) {
            const existing = existingUser[0];
            
            if (existing.username === username) {
                return res.status(400).json({ error: 'Username is already taken' });
            }
            if (existing.email === email) {
                return res.status(400).json({ error: 'Email is already registered' });
            }
            if (existing.phone_number === phoneNumber) {
                return res.status(400).json({ error: 'Phone number is already registered' });
            }
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedPassword = await bcrypt.hash(password, 10);
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); 

        const userData: any = {
            username,
            email: email || null,
            phone_number: phoneNumber || null,
            password: hashedPassword,
            email_verified: false,
            verification_otp: email ? otp : null,
            verification_otp_expires: email ? otpExpires.toISOString() : null,
        };

        const { data: user, error } = await supabaseAdmin
            .from('users')
            .insert(userData)
            .select('id')
            .single();

        if (error) {
            if (error.code === '23505') {
                // Check which field caused the uniqueness violation
                const errorMessage = error.message || '';
                
                if (errorMessage.includes('users_username_key')) {
                    return res.status(400).json({ error: 'Username is already taken' });
                } else if (errorMessage.includes('users_email_key')) {
                    return res.status(400).json({ error: 'Email is already registered' });
                } else if (errorMessage.includes('users_phone_number_key')) {
                    return res.status(400).json({ error: 'Phone number is already registered' });
                } else {
                    return res.status(400).json({ error: 'Username, email or phone already exists' });
                }
            }
            throw error;
        }

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
