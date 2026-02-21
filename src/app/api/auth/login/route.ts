import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../utils/supabase-server';
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

export async function POST(req: NextRequest) {
    try {
        const { identifier, password, termsAccepted, cookieConsent } = await req.json();

        if (!identifier || !password) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
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
            return NextResponse.json({ message: 'Invalid credentials' , users : users }, { status: 401 });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ message: 'Invalid credentials' , users : users }, { status: 401 });
        }

        // Check if email is verified (only if user has email)
        if (user.email && !user.email_verified) {
            return NextResponse.json({ 
                message: 'Please verify your email before logging in',
                requiresEmailVerification: true,
                email: user.email
            }, { status: 403 });
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

        const response = NextResponse.json({
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
        console.error('Login error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
