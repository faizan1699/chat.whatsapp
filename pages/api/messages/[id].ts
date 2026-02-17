import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
    if (!id || typeof id !== 'string') return res.status(400).end();

    if (req.method === 'DELETE') {
        try {
            await supabaseAdmin
                .from('messages')
                .update({
                    is_deleted: true,
                    content: '',
                    audio_url: null,
                })
                .eq('id', id);

            res.status(200).json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete message' });
        }
    } else if (req.method === 'PATCH') {
        const { status } = req.body;
        try {
            await supabaseAdmin
                .from('messages')
                .update({ status })
                .eq('id', id);

            res.status(200).json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update status' });
        }
    } else {
        res.status(405).end();
    }
}
