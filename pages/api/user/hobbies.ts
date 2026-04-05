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

            // Delete existing user hobbies
            const { error: deleteError } = await supabaseAdmin
                .from('UserHobby')
                .delete()
                .eq('userId', authUser.userId);

            if (deleteError) {
                console.error('Error deleting existing hobbies:', deleteError);
                return res.status(500).json({ error: 'Failed to update hobbies' });
            }

            // Add new hobbies if any provided
            if (hobbyIds.length > 0) {
                const userHobbies = hobbyIds.map((hobbyId: string) => ({
                    userId: authUser.userId,
                    hobbyId,
                    createdAt: new Date().toISOString()
                }));

                const { error: insertError } = await supabaseAdmin
                    .from('UserHobby')
                    .insert(userHobbies);

                if (insertError) {
                    console.error('Error adding hobbies:', insertError);
                    return res.status(500).json({ error: 'Failed to add hobbies' });
                }
            }

            return res.status(200).json({ message: 'Hobbies updated successfully' });
        } catch (err) {
            console.error('Update user hobbies error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    return res.status(405).json({ message: 'Method not allowed' });
}
