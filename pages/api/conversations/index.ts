import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        const { userId } = req.query;
        if (!userId || typeof userId !== 'string') return res.status(400).end();

        try {
            const conversations = await prisma.conversation.findMany({
                where: {
                    participants: {
                        some: { userId: userId }
                    }
                },
                include: {
                    participants: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    avatar: true
                                }
                            }
                        }
                    },
                    messages: {
                        orderBy: { timestamp: 'desc' },
                        take: 1
                    }
                }
            });
            res.status(200).json(conversations);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch conversations' });
        }
    } else if (req.method === 'POST') {
        const { participantIds } = req.body;
        if (!participantIds || !Array.isArray(participantIds)) return res.status(400).end();

        try {
            // Check if 1-on-1 conversation already exists
            if (participantIds.length === 2) {
                const existing = await prisma.conversation.findFirst({
                    where: {
                        isGroup: false,
                        AND: [
                            { participants: { some: { userId: participantIds[0] } } },
                            { participants: { some: { userId: participantIds[1] } } }
                        ]
                    }
                });
                if (existing) return res.status(200).json(existing);
            }

            const conversation = await prisma.conversation.create({
                data: {
                    isGroup: participantIds.length > 2,
                    participants: {
                        create: participantIds.map(id => ({ userId: id }))
                    }
                }
            });
            res.status(201).json(conversation);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create conversation' });
        }
    } else {
        res.status(405).end();
    }
}
