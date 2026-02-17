import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../../utils/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'DELETE') return res.status(405).end();

    const { id } = req.query;
    if (!id || typeof id !== 'string') return res.status(400).end();

    try {
        // Delete all messages in the conversation
        const { error } = await supabaseAdmin
            .from('messages')
            .delete()
            .eq('conversation_id', id);

        if (error) throw error;

        res.status(200).json({ message: 'All messages deleted successfully' });
    } catch (error) {
        console.error('Failed to delete messages:', error);
        res.status(500).json({ error: 'Failed to delete messages' });
    }
}
