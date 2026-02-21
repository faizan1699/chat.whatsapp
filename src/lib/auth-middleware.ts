import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';

// Protection middleware for API routes
export async function withAuth(
  handler: (req: NextRequest, session: any) => Promise<NextResponse>,
  options: { requireVerified?: boolean } = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const session = await getSession(req);
      
      if (!session?.userId) {
        return NextResponse.json(
          { error: 'Unauthorized - Please login first' },
          { status: 401 }
        );
      }

      // If email verification is required, check if user is verified
      if (options.requireVerified) {
        // You might want to add a database check here for email verification
        // For now, we'll just check session exists
      }

      // Call the original handler with session
      return await handler(req, session);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      );
    }
  };
}

// Simple auth check function
export async function requireAuth(req: NextRequest) {
  const session = await getSession(req);
  
  if (!session?.userId) {
    throw new Error('Unauthorized');
  }
  
  return session;
}
