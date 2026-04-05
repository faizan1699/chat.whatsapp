import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT, JWTPayload } from 'jose';
import { supabaseAdmin } from '@/utils/supabase-server';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_dont_use_in_production');
const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_dont_use_in_production');

interface RefreshTokenPayload extends JWTPayload {
    userId: string;
    username: string;
    type: 'refresh';
}

export async function POST(request: NextRequest) {
    try {
        const { refreshToken } = await request.json();
        
        if (!refreshToken) {
            return NextResponse.json(
                { error: 'No refresh token provided' },
                { status: 401 }
            );
        }

        const { payload } = await jwtVerify(refreshToken, refreshSecret) as { payload: RefreshTokenPayload };
        
        if (payload.type !== 'refresh') {
            return NextResponse.json(
                { error: 'Invalid token type' },
                { status: 401 }
            );
        }

        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('id, username, email, phone_number')
            .eq('id', payload.userId)
            .single();

        if (error || !user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 401 }
            );
        }

        const newAccessToken = await new SignJWT({
            userId: payload.userId, 
            username: payload.username,
            type: 'access'
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('1h')
            .sign(secret);

        const newRefreshToken = await new SignJWT({
            userId: payload.userId, 
            username: payload.username,
            type: 'refresh'
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('30d')
            .sign(refreshSecret);

        return NextResponse.json({
            message: 'Session refreshed successfully',
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            status: 200
        }, {status: 200});

    } catch (error) {
        console.error('Session refresh error:', error);
        return NextResponse.json(
            { error: 'Invalid refresh token' },
            { status: 401 }
        );
    }
}
