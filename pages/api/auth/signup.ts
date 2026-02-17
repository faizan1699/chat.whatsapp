import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_dont_use_in_production';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { username, email, phoneNumber, password } = req.body;

        if (!username || !password || (!email && !phoneNumber)) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const conditions: string[] = [`username.eq.${JSON.stringify(username)}`];
        if (email) conditions.push(`email.eq.${JSON.stringify(email)}`);
        if (phoneNumber) conditions.push(`phone_number.eq.${JSON.stringify(phoneNumber)}`);
        const { data: existing } = await supabaseAdmin
            .from('users')
            .select('id')
            .or(conditions.join(','))
            .limit(1);

        if (existing?.length) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const { data: user, error } = await supabaseAdmin
            .from('users')
            .insert({
                username,
                email: email || null,
                phone_number: phoneNumber || null,
                password: hashedPassword,
            })
            .select('id, username, email, phone_number')
            .single();

        if (error) throw error;

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        const cookie = serialize('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        res.setHeader('Set-Cookie', cookie);
        return res.status(201).json({
            message: 'User created successfully',
            user: { username: user.username, email: user.email, phoneNumber: user.phone_number }
        });

    } catch (error: unknown) {
        console.error('Signup error:', error);
        return res.status(500).json({ message: (error as Error).message || 'Error creating user' });
    }
}
