import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { supabaseAdmin } from '@/utils/supabase-server';
import { withAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  const authHandler = await withAuth(async (req: NextRequest, session: any) => {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, username, email, phone_number, avatar, created_at, updated_at')
      .eq('id', session.userId)
      .single();

    if (error) {
      console.error('Database error fetching user profile:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Transform data to match frontend expectations
    const transformedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phone_number,
      avatar: user.avatar,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };

    return NextResponse.json({
      data: transformedUser,
      message: 'User profile fetched successfully'
    });
  });
  return authHandler(request);
}

export async function PUT(request: NextRequest) {
  const authHandler = await withAuth(async (req: NextRequest, session: any) => {
    const body = await req.json();
    const { username, email, phoneNumber, avatar } = body;

    // Validate required fields
    if (!username || username.trim().length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters long' },
        { status: 400 }
      );
    }

    // Check if username is already taken by another user
    if (username) {
      const { data: existingUser, error: checkError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('username', username.trim())
        .neq('id', session.userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Database error checking username:', checkError);
        return NextResponse.json(
          { error: 'Failed to validate username' },
          { status: 500 }
        );
      }

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 409 }
        );
      }
    }

    // Check if email is already taken by another user
    if (email) {
      const { data: existingEmail, error: emailCheckError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email.trim())
        .neq('id', session.userId)
        .single();

      if (emailCheckError && emailCheckError.code !== 'PGRST116') {
        console.error('Database error checking email:', emailCheckError);
        return NextResponse.json(
          { error: 'Failed to validate email' },
          { status: 500 }
        );
      }

      if (existingEmail) {
        return NextResponse.json(
          { error: 'Email is already taken' },
          { status: 409 }
        );
      }
    }

    // Check if phone number is already taken by another user
    if (phoneNumber) {
      const { data: existingPhone, error: phoneCheckError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone_number', phoneNumber.trim())
        .neq('id', session.userId)
        .single();

      if (phoneCheckError && phoneCheckError.code !== 'PGRST116') {
        console.error('Database error checking phone number:', phoneCheckError);
        return NextResponse.json(
          { error: 'Failed to validate phone number' },
          { status: 500 }
        );
      }

      if (existingPhone) {
        return NextResponse.json(
          { error: 'Phone number is already taken' },
          { status: 409 }
        );
      }
    }

    // Update user profile
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        username: username.trim(),
        email: email?.trim() || null,
        phone_number: phoneNumber?.trim() || null,
        avatar: avatar?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.userId)
      .select('id, username, email, phone_number, avatar, created_at, updated_at')
      .single();

    if (updateError) {
      console.error('Database error updating user profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 500 }
      );
    }

    // Transform data to match frontend expectations
    const transformedUser = {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      phoneNumber: updatedUser.phone_number,
      avatar: updatedUser.avatar,
      createdAt: updatedUser.created_at,
      updatedAt: updatedUser.updated_at
    };

    return NextResponse.json({
      data: transformedUser,
      message: 'User profile updated successfully'
    });
  });
  return authHandler(request);
}
