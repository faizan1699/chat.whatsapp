import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';

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
    const { conversationId, senderId, content, isVoice, audioUrl, audioDuration } = body;

    if (!conversationId || !senderId) {
      return NextResponse.json(
        { error: 'Conversation ID and sender ID are required' },
        { status: 400 }
      );
    }

    // For now, return a mock message
    // TODO: Implement actual database logic to send message
    return NextResponse.json({
      data: {
        id: `msg_${Date.now()}`,
        conversationId,
        senderId,
        content: content || '',
        isVoice: isVoice || false,
        audioUrl: audioUrl || '',
        audioDuration: audioDuration || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
