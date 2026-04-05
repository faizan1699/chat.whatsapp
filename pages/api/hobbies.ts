import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../utils/supabase-server';
import { getAuthUser } from '../../utils/auth';

// Simple UUID generator
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Remove auth requirement for GET requests
    // For POST requests, require authentication
    const authUser = getAuthUser(req);
    if (!authUser) {
        return res.status(401).json({ error: 'Please login' });
    }

    if (req.method === 'GET') {
        try {
            // Get all available hobbies
            const { data: hobbies, error } = await supabaseAdmin
                .from('hobby')
                .select('id, name')
                .order('name', { ascending: true });

            if (error) {
                console.error('Error fetching hobbies:', error);
                return res.status(500).json({ error: 'Failed to fetch hobbies' });
            }

            return res.status(200).json({
                hobbies: hobbies || [],
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

            const { data: existingHobby, error: checkError } = await supabaseAdmin
                .from('hobby')
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
                .from('hobby')
                .insert({
                    id: generateUUID(),
                    name: trimmedName,
                    createdAt: new Date().toISOString(),
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
