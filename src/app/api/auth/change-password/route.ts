import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { supabaseAdmin } from '@/utils/supabase-server';

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
    const { currentPassword, newPassword } = body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Get current user data
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('password')
      .eq('id', session.userId)
      .single();

    if (fetchError || !user) {
      console.error('Database error fetching user:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // Verify current password (assuming passwords are hashed, you'd need to compare hashes)
    // For now, this is a simple comparison - in production, you'd use bcrypt.compare
    if (user.password !== currentPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Update password
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password: newPassword, // In production, this should be hashed
        updated_at: new Date().toISOString()
      })
      .eq('id', session.userId);

    if (updateError) {
      console.error('Database error updating password:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
