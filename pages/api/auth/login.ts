import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';
import bcrypt from 'bcryptjs';
import { SignJWT, JWTPayload } from 'jose';
import { serialize } from 'cookie';

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
        const { identifier, password, termsAccepted, cookieConsent } = req.body;

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

        // Create access token (1 hour)
        const accessPayload: SessionPayload = {
            userId: user.id,
            username: user.username,
            type: 'access'
        };

        const accessToken = await new SignJWT(accessPayload)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('1h')
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

        // Set cookies using NextResponse
        const isProduction = process.env.NODE_ENV === 'production';

        res.setHeader('Set-Cookie', [
            serialize('access_token', accessToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'strict',
                maxAge: 60 * 60 * 60, // 1 hour
                path: '/',
            }),
            serialize('refresh_token', refreshToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/',
            }),
            serialize('user-id', user.id, {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 30,
                path: '/',
            }),
            serialize('username', user.username, {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 30,
                path: '/',
            }),
        ]);

        const updateData: any = {
            updatedAt: new Date().toISOString()
        };

        if (termsAccepted !== undefined) {
            updateData.termsAccepted = termsAccepted;
            updateData.termsAcceptedAt = termsAccepted ? new Date().toISOString() : null;
        }

        // Update cookie consent if provided
        if (cookieConsent !== undefined) {
            updateData.cookieConsent = cookieConsent;
            updateData.cookieConsentAt = new Date().toISOString();
        }

        // Update user record with consent information (skip if columns don't exist)
        if (Object.keys(updateData).length > 1) {
            try {
                await supabaseAdmin
                    .from('users')
                    .update(updateData)
                    .eq('id', user.id);
            } catch (updateError) {
                console.error('Error updating user consent (columns might not exist):', updateError);
            }
        }

        return res.status(200).json({
            message: 'Logged in successfully',
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                phoneNumber: user.phone_number
            }
        });

    } catch (error: unknown) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
