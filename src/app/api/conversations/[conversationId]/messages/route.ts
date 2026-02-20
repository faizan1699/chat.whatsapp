import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { supabaseAdmin } from '@/utils/supabase-server';

export async function GET(
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

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Fetch messages from database (messages table uses 'timestamp', not 'created_at')
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        is_voice_message,
        audio_url,
        audio_duration,
        status,
        is_deleted,
        is_edited,
        is_pinned,
        timestamp,
        reply_to,
        sender:users!messages_sender_id_fkey (
          id,
          username,
          email,
          avatar
        )
      `)
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Database error fetching messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Transform messages to match frontend format
    const transformedMessages = messages.map((msg: any) => ({
      id: msg.id,
      conversationId: msg.conversation_id,
      senderId: msg.sender_id,
      from: 'Unknown', // Will be updated later
      to: session.username, // Current user is recipient
      message: msg.content,
      timestamp: msg.timestamp,
      status: msg.status,
      isVoiceMessage: msg.is_voice_message,
      audioUrl: msg.audio_url,
      audioDuration: msg.audio_duration,
      isDeleted: msg.is_deleted,
      isEdited: msg.is_edited,
      isPinned: msg.is_pinned,
      replyTo: undefined, // Simplified for now
      sender: { username: 'Unknown' } // Simplified for now
    }));

    return NextResponse.json(transformedMessages);

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
