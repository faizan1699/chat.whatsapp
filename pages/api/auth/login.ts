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
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ message: 'Missing fields' });
        }

        const orFilter = ['username', 'email', 'phone_number']
            .map((col) => `${col}.eq.${JSON.stringify(identifier)}`)
            .join(',');
        const { data: users, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .or(orFilter)
            .limit(1);

        if (error) throw error;

        const user = users?.[0];
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set multiple cookies for session management
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
            message: 'Logged in successfully',
            user: { id: user.id, username: user.username, email: user.email, phoneNumber: user.phone_number }
        });

    } catch (error: unknown) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
