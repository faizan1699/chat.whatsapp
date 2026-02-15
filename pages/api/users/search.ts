import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    const { q } = req.query;

    if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Query parameter required' });
    }

    try {
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { email: { contains: q, mode: 'insensitive' } },
                    { phoneNumber: { contains: q } },
                    { username: { contains: q, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                username: true,
                email: true,
                phoneNumber: true,
                avatar: true,
            },
            limit: 10,
        });

        res.status(200).json(users);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
