import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { supabaseAdmin } from '@/utils/supabase-server';

/** Resolve username to user ID */
async function resolveUserId(username: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from('users').select('id').eq('username', username).maybeSingle();
  return data?.id ?? null;
}

/** Record a completed call (caller or callee). Accepts userIds or usernames. */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { callerId, calleeId, callerUsername, calleeUsername, callType, durationSeconds, status } = body;

    let resolvedCallerId = callerId;
    let resolvedCalleeId = calleeId;

    if ((!resolvedCallerId || !resolvedCalleeId) && (callerUsername && calleeUsername)) {
      resolvedCallerId = (await resolveUserId(callerUsername)) ?? resolvedCallerId;
      resolvedCalleeId = (await resolveUserId(calleeUsername)) ?? resolvedCalleeId;
    }

    if (!resolvedCallerId || !resolvedCalleeId || !callType) {
      return NextResponse.json(
        { error: 'callerId/calleeId (or callerUsername/calleeUsername) and callType are required' },
        { status: 400 }
      );
    }

    const validType = callType === 'audio' || callType === 'video';
    if (!validType) {
      return NextResponse.json({ error: 'callType must be audio or video' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('calls')
      .insert({
        caller_id: resolvedCallerId,
        callee_id: resolvedCalleeId,
        call_type: callType,
        duration_seconds: durationSeconds ?? 0,
        status: status ?? 'completed'
      })
      .select('id, started_at, duration_seconds')
      .single();

    if (error) {
      console.error('Database error recording call:', error);
      return NextResponse.json({ error: 'Failed to record call' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (e) {
    console.error('Error recording call:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** Fetch call history for current user */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);

    const { data, error } = await supabaseAdmin
      .from('calls')
      .select('id, caller_id, callee_id, call_type, started_at, duration_seconds, status')
      .or(`caller_id.eq.${session.userId},callee_id.eq.${session.userId}`)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Database error fetching calls:', error);
      return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (e) {
    console.error('Error fetching calls:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
