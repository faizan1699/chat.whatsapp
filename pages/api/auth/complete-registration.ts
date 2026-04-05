import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';
import { SignJWT, JWTPayload } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_dont_use_in_production');
const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_dont_use_in_production');

interface SessionPayload extends JWTPayload {
    userId: string;
    username: string;
    type: 'access';
}

interface RefreshTokenPayload extends JWTPayload {
    userId: string;
    username: string;
    type: 'refresh';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { username, email, avatar } = req.body;

        if (!username || !email) {
            return res.status(400).json({ message: 'Username and email are required' });
        }

        // Update user with avatar
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .update({
                avatar: avatar || null,
            })
            .eq('username', username)
            .eq('email', email)
            .select('id, username, email, phone_number, avatar')
            .single();

        if (error || !user) {
            return res.status(500).json({ message: 'Failed to complete registration' });
        }

        // Create access token (30 days - 1 month)
        const accessPayload: SessionPayload = {
            userId: user.id,
            username: user.username,
            type: 'access'
        };

        const accessToken = await new SignJWT(accessPayload)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('30d')
            .sign(secret);

        // Create refresh token (30 days)
        const refreshPayload: RefreshTokenPayload = {
            userId: user.id,
            username: user.username,
            type: 'refresh'
        };

        const refreshToken = await new SignJWT(refreshPayload)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('30d')
            .sign(refreshSecret);

        return res.status(200).json({
            message: 'Registration completed successfully',
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                phone: user.phone_number,
                avatar: user.avatar,
            }
        });

    } catch (error: unknown) {
        console.error('Complete registration error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
