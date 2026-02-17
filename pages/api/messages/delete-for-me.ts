import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { messageId, userId } = req.body;

        if (!messageId || !userId) {
            return res.status(400).json({ error: 'Message ID and User ID are required' });
        }

        // Get current message
        const { data: message, error: fetchError } = await supabaseAdmin
            .from('messages')
            .select('is_deleted_from_me')
            .eq('id', messageId)
            .single();

        if (fetchError || !message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Update is_deleted_from_me field
        const currentDeletedFromMe = (message.is_deleted_from_me as Record<string, boolean>) || {};
        currentDeletedFromMe[userId] = true;

        const { error: updateError } = await supabaseAdmin
            .from('messages')
            .update({
                is_deleted_from_me: currentDeletedFromMe
            })
            .eq('id', messageId);

        if (updateError) {
            console.error('Error updating is_deleted_from_me:', updateError);
            return res.status(500).json({ error: 'Failed to delete message for user' });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error in delete-for-me API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
