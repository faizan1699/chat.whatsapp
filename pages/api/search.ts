import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../utils/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { q, hobby, limit = 20, offset = 0 } = req.query;

        let searchQuery = '';

        // If searching by hobby
        if (hobby && typeof hobby === 'string') {
            // UserHobby table doesn't exist, return empty result
            return res.status(200).json({
                users: [],
                type: 'hobby_search',
                hobby: hobby,
                total: 0
            });
        }

        // General text search across hobbies
        if (q && typeof q === 'string') {
            searchQuery = q.trim();

            // First find matching hobbies
            const { data: matchingHobbies, error: hobbiesError } = await supabaseAdmin
                .from('hobby')
                .select('id, name')
                .ilike('name', `%${searchQuery}%`)
                .limit(10);

            if (hobbiesError) {
                console.error('Error searching hobbies:', hobbiesError);
                return res.status(500).json({ error: 'Failed to search hobbies' });
            }

            // UserHobby table doesn't exist, so we can't search users by hobbies
            // Just return matching hobbies without users
            return res.status(200).json({
                users: [],
                matchingHobbies,
                type: 'text_search',
                query: searchQuery,
                total: matchingHobbies.length
            });
        }

        // If no search parameters, return all hobbies
        const { data: allHobbies, error: allHobbiesError } = await supabaseAdmin
            .from('hobby')
            .select('id, name')
            .order('name', { ascending: true })
            .range(Number(offset), Number(offset) + Number(limit) - 1);

        if (allHobbiesError) {
            console.error('Error fetching all hobbies:', allHobbiesError);
            return res.status(500).json({ error: 'Failed to fetch hobbies' });
        }

        return res.status(200).json({
            hobbies: allHobbies || [],
            type: 'all_hobbies',
            total: allHobbies?.length || 0
        });

    } catch (error) {
        console.error('Search API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
