import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { supabaseAdmin } from '@/utils/supabase-server';
import { sanitizeText, validateMessageContent } from '@/lib/messageValidation';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);

    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, senderId, content, to, from, isVoice, audioUrl, audioDuration } = body;

    if (!conversationId || !senderId) {
      return NextResponse.json(
        { error: 'Conversation ID and sender ID are required' },
        { status: 400 }
      );
    }

    // Validate text content for security and scale
    if (!isVoice && content !== undefined) {
      const { valid, error } = validateMessageContent(content);
      if (!valid) {
        return NextResponse.json({ error: error ?? 'Invalid message' }, { status: 400 });
      }
    }

    const safeContent = isVoice ? '' : sanitizeText(content ?? '');

    // Insert message into database (messages table uses 'timestamp', not 'created_at')
    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: safeContent,
        is_voice_message: isVoice || false,
        audio_url: audioUrl || null,
        audio_duration: audioDuration || null,
        status: 'sent'
        // timestamp defaults to NOW() in schema
      })
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        is_voice_message,
        audio_url,
        audio_duration,
        status,
        timestamp
      `)
      .single();

    if (error) {
      console.error('Database error sending message:', error);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        id: message.id,
        conversationId: message.conversation_id,
        senderId: message.sender_id,
        content: message.content,
        from: from || 'Unknown',
        to: to || 'Unknown',
        message: message.content,
        timestamp: message.timestamp,
        status: message.status,
        isVoiceMessage: message.is_voice_message,
        audioUrl: message.audio_url,
        audioDuration: message.audio_duration,
        sender: { username: 'Unknown' } // Simplified for now
      },
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
