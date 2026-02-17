import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    const { q } = req.query;

    if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Query parameter required' });
    }

    try {
        const searchTerm = `%${q}%`;
        const { data: users, error } = await supabaseAdmin
            .from('users')
            .select('id, username, email, phone_number, avatar')
            .or(`username.ilike.${JSON.stringify(searchTerm)},email.ilike.${JSON.stringify(searchTerm)},phone_number.ilike.${JSON.stringify(searchTerm)}`)
            .limit(10);

        if (error) throw error;

        const mapped = (users || []).map((u) => ({
            id: u.id,
            username: u.username,
            email: u.email,
            phoneNumber: u.phone_number,
            avatar: u.avatar,
        }));

        res.status(200).json(mapped);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
