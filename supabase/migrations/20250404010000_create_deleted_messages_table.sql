-- Create deleted_messages table to store permanently deleted messages
CREATE TABLE IF NOT EXISTS deleted_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  original_message_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  deleted_by TEXT NOT NULL REFERENCES users(id),
  original_content TEXT NOT NULL,
  original_audio_url TEXT,
  original_audio_duration FLOAT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  deletion_reason TEXT DEFAULT 'deleted_by_sender', -- deleted_by_sender, admin_action, etc.
  reply_to JSONB,
  is_voice_message BOOLEAN DEFAULT FALSE,
  is_edited BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_deleted_messages_conversation ON deleted_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_deleted_messages_sender ON deleted_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_deleted_messages_deleted_by ON deleted_messages(deleted_by);
CREATE INDEX IF NOT EXISTS idx_deleted_messages_original_message ON deleted_messages(original_message_id);
