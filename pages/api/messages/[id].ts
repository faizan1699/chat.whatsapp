import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
    if (!id || typeof id !== 'string') return res.status(400).end();

    if (req.method === 'DELETE') {
        try {
            await prisma.message.update({
                where: { id },
                data: {
                    isDeleted: true,
                    content: '',
                    audioUrl: null
                }
            });
            res.status(200).json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete message' });
        }
    } else if (req.method === 'PATCH') {
        const { status } = req.body;
        try {
            await prisma.message.update({
                where: { id },
                data: { status }
            });
            res.status(200).json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update status' });
        }
    } else {
        res.status(405).end();
    }
}
