-- RLS Policies for production. App uses service_role (bypasses RLS) for API.
-- These policies apply when using anon/authenticated keys (e.g. Supabase Auth).

-- Users: users can read their own profile
CREATE POLICY "Users can read own" ON users FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update own" ON users FOR UPDATE
  USING (auth.uid()::text = id);

-- Conversations: participants can read
CREATE POLICY "Participants can read conversations" ON conversations FOR SELECT
  USING (
    id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()::text
    )
  );

-- Conversation participants: members can read
CREATE POLICY "Members can read participants" ON conversation_participants FOR SELECT
  USING (
    user_id = auth.uid()::text
    OR conversation_id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()::text
    )
  );

-- Messages: participants can read, senders can insert
CREATE POLICY "Participants can read messages" ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Senders can insert messages" ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid()::text);

CREATE POLICY "Senders can update own messages" ON messages FOR UPDATE
  USING (sender_id = auth.uid()::text);

-- Calls: caller/callee can read their calls
CREATE POLICY "Users can read own calls" ON calls FOR SELECT
  USING (caller_id = auth.uid()::text OR callee_id = auth.uid()::text);

CREATE POLICY "Users can insert calls they participated in" ON calls FOR INSERT
  WITH CHECK (caller_id = auth.uid()::text OR callee_id = auth.uid()::text);
