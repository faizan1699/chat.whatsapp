-- ============================================================
-- Supabase Setup - Run this ONCE in Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Paste & Run
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  phone_number TEXT UNIQUE,
  password TEXT NOT NULL,
  avatar TEXT,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT,
  is_group BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation participants
CREATE TABLE IF NOT EXISTS conversation_participants (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id),
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, conversation_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  sender_id TEXT NOT NULL REFERENCES users(id),
  content TEXT DEFAULT '',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent',
  is_voice_message BOOLEAN DEFAULT FALSE,
  audio_url TEXT,
  audio_duration FLOAT,
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  reply_to JSONB,
  group_id TEXT,
  chunk_index INT,
  total_chunks INT
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- Calls table: track audio/video call duration
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

-- Enable RLS (optional - service_role bypasses it)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
