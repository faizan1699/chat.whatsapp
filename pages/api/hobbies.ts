import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../utils/supabase-server';
import { getAuthUser } from '../../utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authUser = getAuthUser(req);
    if (!authUser) {
        return res.status(401).json({ error: 'Please login' });
    }

    if (req.method === 'GET') {
        try {
            // Get all available hobbies
            const { data: hobbies, error } = await supabaseAdmin
                .from('hoby')
                .select('id, name')
                .order('name', { ascending: true });

            if (error) {
                console.error('Error fetching hobbies:', error);
                return res.status(500).json({ error: 'Failed to fetch hobbies' });
            }

            // Get user's current hobbies
            const { data: userHobbies, error: userHobbiesError } = await supabaseAdmin
                .from('user_hoby')
                .select('hobbyId')
                .eq('userId', authUser.userId);

            if (userHobbiesError) {
                console.error('Error fetching user hobbies:', userHobbiesError);
                return res.status(500).json({ error: 'Failed to fetch user hobbies' });
            }

            const userHobbyIds = userHobbies?.map((uh: any) => uh.hobbyId) || [];

            return res.status(200).json({
                hobbies: hobbies || [],
                userHobbyIds
            });
        } catch (err) {
            console.error('Hobbies API error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    if (req.method === 'POST') {
        try {
            const { name } = req.body;

            if (!name || typeof name !== 'string' || name.trim().length === 0) {
                return res.status(400).json({ error: 'Hobby name is required' });
            }

            const trimmedName = name.trim().toLowerCase();

            // Check if hobby already exists
            const { data: existingHobby, error: checkError } = await supabaseAdmin
                .from('hoby')
                .select('id, name')
                .eq('name', trimmedName)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                console.error('Error checking existing hobby:', checkError);
                return res.status(500).json({ error: 'Failed to check hobby' });
            }

            if (existingHobby) {
                return res.status(400).json({ error: 'Hobby already exists' });
            }

            // Create new hobby
            const { data: newHobby, error: createError } = await supabaseAdmin
                .from('hoby')
                .insert({
                    name: trimmedName,
                    updatedAt: new Date().toISOString()
                })
                .select('id, name')
                .single();

            if (createError) {
                console.error('Error creating hobby:', createError);
                return res.status(500).json({ error: 'Failed to create hobby' });
            }

            return res.status(201).json(newHobby);
        } catch (err) {
            console.error('Create hobby error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    return res.status(405).json({ message: 'Method not allowed' });
}
