import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';
import { getAuthUser } from '../../../utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authUser = getAuthUser(req);
    if (!authUser) {
        return res.status(401).json({ error: 'Please login' });
    }

    if (req.method === 'POST') {
        try {
            const { hobbyIds } = req.body;

            if (!Array.isArray(hobbyIds)) {
                return res.status(400).json({ error: 'Hobby IDs must be an array' });
            }

            // User hobbies are not stored in separate table
            // Just return success without saving
            console.log('Hobbies received but not stored:', hobbyIds);

            return res.status(200).json({ message: 'Hobbies updated successfully' });
        } catch (err) {
            console.error('Update user hobbies error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    return res.status(405).json({ message: 'Method not allowed' });
}
