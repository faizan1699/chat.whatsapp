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
            // Search users who have this specific hobby
            const { data: usersByHobby, error: hobbyError } = await supabaseAdmin
                .from('UserHobby')
                .select(`
                    userId,
                    user:users (
                        id,
                        username,
                        avatar,
                        UserMeta!inner (
                            bio,
                            dateOfBirth,
                            fatherName,
                            address,
                            cnic,
                            gender
                        )
                    )
                `)
                .eq('hobbyId', hobby)
                .range(Number(offset), Number(offset) + Number(limit) - 1);

            if (hobbyError) {
                console.error('Error searching users by hobby:', hobbyError);
                return res.status(500).json({ error: 'Failed to search users by hobby' });
            }

            const users = usersByHobby?.map((item: any) => ({
                ...item.user,
                meta: item.user.UserMeta
            })) || [];

            return res.status(200).json({
                users,
                type: 'hobby_search',
                hobby: hobby,
                total: users.length
            });
        }

        // General text search across hobbies
        if (q && typeof q === 'string') {
            searchQuery = q.trim();

            // First find matching hobbies
            const { data: matchingHobbies, error: hobbiesError } = await supabaseAdmin
                .from('Hobby')
                .select('id, name')
                .ilike('name', `%${searchQuery}%`)
                .limit(10);

            if (hobbiesError) {
                console.error('Error searching hobbies:', hobbiesError);
                return res.status(500).json({ error: 'Failed to search hobbies' });
            }

            // Then find users who have these hobbies
            if (matchingHobbies && matchingHobbies.length > 0) {
                const hobbyIds = matchingHobbies.map((h: any) => h.id);
                
                const { data: users, error: usersError } = await supabaseAdmin
                    .from('UserHobby')
                    .select(`
                        userId,
                        user:users (
                            id,
                            username,
                            avatar,
                            UserMeta!inner (
                                bio,
                                dateOfBirth,
                                fatherName,
                                address,
                                cnic,
                                gender
                            )
                        ),
                        hobby:Hobby (
                            id,
                            name
                        )
                    `)
                    .in('hobbyId', hobbyIds)
                    .range(Number(offset), Number(offset) + Number(limit) - 1);

                if (usersError) {
                    console.error('Error searching users by hobbies:', usersError);
                    return res.status(500).json({ error: 'Failed to search users' });
                }

                // Group users by their matching hobbies
                const usersByHobby = users?.reduce((acc: any, item: any) => {
                    const userId = item.userId;
                    if (!acc[userId]) {
                        acc[userId] = {
                            ...item.user,
                            meta: item.user.UserMeta,
                            matchingHobbies: []
                        };
                    }
                    acc[userId].matchingHobbies.push(item.hobby);
                    return acc;
                }, {}) || {};

                return res.status(200).json({
                    users: Object.values(usersByHobby),
                    matchingHobbies,
                    type: 'text_search',
                    query: searchQuery,
                    total: Object.keys(usersByHobby).length
                });
            }
        }

        // If no search parameters, return all hobbies
        const { data: allHobbies, error: allHobbiesError } = await supabaseAdmin
            .from('Hobby')
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
