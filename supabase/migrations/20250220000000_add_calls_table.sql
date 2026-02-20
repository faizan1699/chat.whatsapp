-- Calls table: track audio/video call duration, from, to, started_at, ended_at
CREATE TABLE IF NOT EXISTS calls (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  caller_id TEXT NOT NULL REFERENCES users(id),
  callee_id TEXT NOT NULL REFERENCES users(id),
  call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'missed', 'rejected', 'no_answer'))
);

CREATE INDEX IF NOT EXISTS idx_calls_caller ON calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_calls_callee ON calls(callee_id);
CREATE INDEX IF NOT EXISTS idx_calls_started_at ON calls(started_at);
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
