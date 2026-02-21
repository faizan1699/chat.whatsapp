-- ============================================================
-- Complete Database Schema - Run this in Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Paste & Run
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table with all fields
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  phone_number TEXT UNIQUE,
  password TEXT NOT NULL,
  avatar TEXT,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Legal and consent fields
  terms_accepted BOOLEAN DEFAULT FALSE,
  terms_accepted_at TIMESTAMPTZ,
  cookie_consent BOOLEAN DEFAULT FALSE,
  cookie_consent_at TIMESTAMPTZ,
  
  -- Email verification fields
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMPTZ,
  email_otp TEXT,
  email_otp_expiry TIMESTAMPTZ,
  
  -- Timestamps with automatic defaults
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
  is_deleted_from_me JSONB DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT FALSE,
  reply_to JSONB,
  group_id TEXT,
  chunk_index INT,
  total_chunks INT
);

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

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_calls_caller ON calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_calls_callee ON calls(callee_id);
CREATE INDEX IF NOT EXISTS idx_users_terms_accepted ON users(terms_accepted);
CREATE INDEX IF NOT EXISTS idx_users_cookie_consent_at ON users(cookie_consent_at);

-- Enable RLS (optional - service_role bypasses it)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- Create trigger function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON calls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
