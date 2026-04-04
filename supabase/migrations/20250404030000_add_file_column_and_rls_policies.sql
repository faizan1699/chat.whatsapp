-- Add file attachment column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file JSONB;

-- Create RLS policies for messages table
DROP POLICY IF EXISTS "Users can view their own conversation messages" ON messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

-- Policy to allow users to view messages in conversations they participate in
CREATE POLICY "Users can view their own conversation messages" ON messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()::text
        )
    );

-- Policy to allow users to insert messages in conversations they participate in
CREATE POLICY "Users can insert their own messages" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid()::text AND
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()::text
        )
    );

-- Policy to allow users to update their own messages
CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (
        sender_id = auth.uid()::text
    );

-- Create RLS policies for conversation_participants table
DROP POLICY IF EXISTS "Users can view their own conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can insert their own conversation participants" ON conversation_participants;

CREATE POLICY "Users can view their own conversation participants" ON conversation_participants
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own conversation participants" ON conversation_participants
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- Create RLS policies for conversations table
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can insert conversations" ON conversations;

CREATE POLICY "Users can view conversations they participate in" ON conversations
    FOR SELECT USING (
        id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert conversations" ON conversations
    FOR INSERT WITH CHECK (true);

-- Create RLS policies for users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (id = auth.uid()::text);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = auth.uid()::text);
