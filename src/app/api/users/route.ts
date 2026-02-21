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

    // Search users by username or email
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, username, email, phone_number, created_at')
      .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
      .neq('id', session.userId) // Don't return current user
      .limit(10);

    if (error) {
      console.error('Database error searching users:', error);
      return NextResponse.json(
        { error: 'Failed to search users' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: users || [],
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

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, email, phone_number } = body;

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .or(`username.eq.${username},email.eq.${email}`)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Create new user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        username,
        email: email || null,
        phone_number: phone_number || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: user,
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
