import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    const { id } = req.query; // Conversation ID
    if (!id || typeof id !== 'string') return res.status(400).end();

    try {
        const messages = await prisma.message.findMany({
            where: { conversationId: id },
            orderBy: { timestamp: 'asc' },
            include: {
                sender: {
                    select: {
                        username: true,
                        avatar: true
                    }
                }
            }
        });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
}
