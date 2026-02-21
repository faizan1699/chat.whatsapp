import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST() {
    try {
        const isProduction = process.env.NODE_ENV === 'production';

        const response = NextResponse.json({
            message: 'Logged out successfully'
        });

        // Clear all auth cookies by setting them to expire
        response.headers.set('Set-Cookie', [
            serialize('access_token', '', {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'strict',
                maxAge: 0,
                path: '/',
            }),
            serialize('refresh_token', '', {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'strict',
                maxAge: 0,
                path: '/',
            }),
            serialize('user-id', '', {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'strict',
                maxAge: 0,
                path: '/',
            }),
            serialize('username', '', {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'strict',
                maxAge: 0,
                path: '/',
            }),
        ].join(', '));

        return response;

    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
