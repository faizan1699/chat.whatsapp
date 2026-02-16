import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../../utils/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    const { id } = req.query;
    const { userId } = req.body;
    
    if (!id || typeof id !== 'string' || !userId) {
        return res.status(400).json({ error: 'Conversation ID and User ID are required' });
    }

    try {
        // Update all messages from other users in this conversation to 'read' status
        const { error } = await supabaseAdmin
            .from('messages')
            .update({ status: 'read' })
            .eq('conversation_id', id)
            .neq('sender_id', userId);

        if (error) throw error;

        res.status(200).json({ message: 'Messages marked as read successfully' });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
}
