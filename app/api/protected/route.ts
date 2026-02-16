import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_dont_use_in_production');

export async function GET(request: NextRequest) {
    try {
        // Try to get session from cookies first (for backward compatibility)
        let session = await getSession(request);
        
        // If no session from cookies, try Bearer token
        if (!session) {
            const authHeader = request.headers.get('authorization');
            if (authHeader?.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                try {
                    const { payload } = await jwtVerify(token, secret);
                    if (payload.type === 'access') {
                        session = {
                            userId: payload.userId,
                            username: payload.username,
                            type: 'access'
                        } as any;
                    }
                } catch (error) {
                    console.log('Invalid Bearer token:', error);
                }
            }
        }
        
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized - No session found' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            message: '✅ Authentication successful!',
            user: {
                userId: session.userId,
                username: session.username,
                authenticated: true
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Authentication error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
