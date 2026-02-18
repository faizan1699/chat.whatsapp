import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { supabaseAdmin } from '@/utils/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Search users by username, email, or phone number
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, username, email, phone_number, created_at')
      .or(`username.ilike.%${query}%,email.ilike.%${query}%,phone_number.ilike.%${query}%`)
      .neq('id', session.userId) // Don't return current user
      .limit(10);

    if (error) {
      console.error('Database error searching users:', error);
      return NextResponse.json(
        { error: 'Failed to search users' },
        { status: 500 }
      );
    }

    // Transform data to match frontend expectations
    const transformedUsers = users?.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phone_number,
      avatar: null // Can be added later
    })) || [];

    return NextResponse.json({
      data: transformedUsers,
      message: 'Users searched successfully'
    });

  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
