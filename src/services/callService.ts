/** Record a completed call to the API. Use usernames OR userIds. */
export async function recordCall(params: {
  callerId?: string;
  calleeId?: string;
  callerUsername?: string;
  calleeUsername?: string;
  callType: 'audio' | 'video';
  durationSeconds: number;
  status?: 'completed' | 'missed' | 'rejected' | 'no_answer';
  accessToken: string;
}): Promise<void> {
  const body: Record<string, unknown> = {
    callType: params.callType,
    durationSeconds: params.durationSeconds,
    status: params.status ?? 'completed'
  };
  if (params.callerId) body.callerId = params.callerId;
  if (params.calleeId) body.calleeId = params.calleeId;
  if (params.callerUsername) body.callerUsername = params.callerUsername;
  if (params.calleeUsername) body.calleeUsername = params.calleeUsername;

  const res = await fetch('/api/calls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${params.accessToken}` },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? 'Failed to record call');
  }
}
