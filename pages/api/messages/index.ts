import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { conversationId, senderId, content, isVoice, audioUrl, audioDuration } = req.body;

        try {
            const message = await prisma.message.create({
                data: {
                    conversationId,
                    senderId,
                    content: content || "",
                    isVoiceMessage: !!isVoice,
                    audioUrl,
                    audioDuration,
                    status: 'sent'
                }
            });
            res.status(201).json(message);
        } catch (error) {
            res.status(500).json({ error: 'Failed to send message' });
        }
    } else {
        res.status(405).end();
    }
}
