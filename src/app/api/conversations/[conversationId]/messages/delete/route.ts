import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { supabaseAdmin } from '@/utils/supabase-server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getSession(request);
    
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { conversationId } = params;
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const deleteType = searchParams.get('type'); // 'me' or 'everyone'

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    if (deleteType === 'everyone') {
      // Mark message as deleted for everyone
      const { error } = await supabaseAdmin
        .from('messages')
        .update({ 
          is_deleted: true,
          content: '',
          audio_url: null
        })
        .eq('id', messageId)
        .eq('sender_id', session.userId); // Only sender can delete for everyone

      if (error) {
        console.error('Database error deleting message:', error);
        return NextResponse.json(
          { error: 'Failed to delete message' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
