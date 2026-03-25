import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../utils/supabase-server';
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

export async function POST(req: NextRequest) {
    try {
        const { email, otp } = await req.json();

        if (!email || !otp) {
            return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
        }

        // Find user by email
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if OTP matches and is not expired
        if (user.emailOtp !== otp || !user.emailOtpExpiry) {
            return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
        }

        const now = new Date();
        const expiryTime = new Date(user.emailOtpExpiry);
        
        if (now > expiryTime) {
            return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
        }

        // Mark email as verified and clear OTP
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
                emailVerified: true,
                emailVerifiedAt: new Date().toISOString(),
                emailOtp: null,
                emailOtpExpiry: null,
                updatedAt: new Date().toISOString()
            })
            .eq('id', user.id);

        if (updateError) throw updateError;

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

        const isProduction = process.env.NODE_ENV === 'production';

        const response = NextResponse.json({
            message: 'Email verified successfully',
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                phoneNumber: user.phone_number
            }
        });

        // Set cookies
        response.headers.set('Set-Cookie', [
            serialize('access_token', accessToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'strict',
                maxAge: 60 * 60, // 1 hour
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
        ].join(', '));

        return response;

    } catch (error: unknown) {
        console.error('Email verification error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
