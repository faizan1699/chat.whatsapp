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
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Fetch conversations where user is a participant
    const { data: conversations, error } = await supabaseAdmin
      .from('conversation_participants')
      .select(`
        conversation_id,
        conversations!conversation_participants_conversation_id_fkey (
          id,
          name,
          is_group,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Database error fetching conversations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      );
    }

    // Get all conversation IDs to fetch participants
    const conversationIds = conversations?.map(item => item.conversation_id) || [];

    // Fetch all participants for these conversations with user details
    const { data: participants, error: participantsError } = await supabaseAdmin
      .from('conversation_participants')
      .select(`
        conversation_id,
        user_id,
        users!conversation_participants_user_id_fkey (
          id,
          username,
          email,
          avatar
        )
      `)
      .in('conversation_id', conversationIds);

    if (participantsError) {
      console.error('Database error fetching participants:', participantsError);
      return NextResponse.json(
        { error: 'Failed to fetch participants' },
        { status: 500 }
      );
    }

    // Transform the data to match expected format
    const transformedConversations = conversations?.map((item: any) => {
      const conversationParticipants = participants?.filter(
        p => p.conversation_id === item.conversation_id
      ) || [];

      return {
        id: item.conversations?.id,
        name: item.conversations?.name,
        is_group: item.conversations?.is_group,
        created_at: item.conversations?.created_at,
        updated_at: item.conversations?.updated_at,
        conversation_id: item.conversation_id,
        participants: conversationParticipants.map((p: any) => ({
          user: p.users
        }))
      };
    }) || [];

    return NextResponse.json({
      data: transformedConversations,
      message: 'Conversations fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
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
    const { participantIds } = body;

    if (!participantIds || !Array.isArray(participantIds)) {
      return NextResponse.json(
        { error: 'Participant IDs are required' },
        { status: 400 }
      );
    }

    // Create conversation
    const { data: conversation, error: conversationError } = await supabaseAdmin
      .from('conversations')
      .insert({
        name: null, // Can be updated later for group chats
        is_group: participantIds.length > 2
      })
      .select()
      .single();

    if (conversationError) {
      console.error('Error creating conversation:', conversationError);
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      );
    }

    // Add participants
    const participants = participantIds.map(userId => ({
      conversation_id: conversation.id,
      user_id: userId
    }));

    const { error: participantsError } = await supabaseAdmin
      .from('conversation_participants')
      .insert(participants);

    if (participantsError) {
      console.error('Error adding participants:', participantsError);
      // Rollback conversation creation if participants failed
      await supabaseAdmin
        .from('conversations')
        .delete()
        .eq('id', conversation.id);
      
      return NextResponse.json(
        { error: 'Failed to add participants' },
        { status: 500 }
      );
    }

    // Fetch the complete conversation with participants
    const { data: completeConversation, error: fetchError } = await supabaseAdmin
      .from('conversation_participants')
      .select(`
        conversation_id,
        users (
          id,
          username,
          email,
          avatar
        )
      `)
      .eq('conversation_id', conversation.id);

    if (fetchError) {
      console.error('Error fetching complete conversation:', fetchError);
    }

    const responseConversation = {
      ...conversation,
      participants: completeConversation?.map((p: any) => ({
        user: p.users
      })) || []
    };

    return NextResponse.json({
      data: responseConversation,
      message: 'Conversation created successfully'
    });

  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
