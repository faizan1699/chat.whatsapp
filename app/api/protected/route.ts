import { NextRequest, NextResponse } from 'next/server';
import { getSession, refreshSession } from '@/lib/auth-server';
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
        
        // If still no session, try to refresh using refresh token
        if (!session) {
            console.log(' No valid session found, attempting refresh...');
            
            // Create a response object for refreshSession
            const response = NextResponse.json({});
            
            // Try to refresh the session
            session = await refreshSession(request, response);
            
            if (session) {
                console.log(' Session refreshed successfully');
                // Return the refreshed session with new cookies
                return NextResponse.json({
                    message: ' Authentication successful! (Session refreshed)',
                    user: {
                        userId: session.userId,
                        username: session.username,
                        authenticated: true
                    },
                    timestamp: new Date().toISOString(),
                    sessionRefreshed: true
                }, {
                    headers: response.headers
                });
            }
        }
        
        if (!session) {
            return NextResponse.json(
                { 
                    error: 'Unauthorized - No valid session found',
                    requiresLogin: true,
                    message: 'Please log in again to continue'
                },
                { status: 401 }
            );
        }

        return NextResponse.json({
            message: ' Authentication successful!',
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
