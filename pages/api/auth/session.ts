import { NextApiRequest, NextApiResponse } from 'next';
import { setAuthCookie } from '../../../utils/cookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { username, userId, authToken } = req.body;
        
        if (!username || !userId || !authToken) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        try {
            // Set secure cookies
            setAuthCookie(res, authToken, userId, username);
            
            res.status(200).json({ 
                success: true,
                message: 'Secure session created'
            });
        } catch (error) {
            console.error('Error creating secure session:', error);
            res.status(500).json({ error: 'Failed to create session' });
        }
    } else if (req.method === 'DELETE') {
        try {
            // Clear secure cookies
            res.setHeader('Set-Cookie', [
                'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; HttpOnly; Secure; SameSite=strict',
                'user-id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; HttpOnly; Secure; SameSite=strict',
                'username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; HttpOnly; Secure; SameSite=strict'
            ]);
            
            res.status(200).json({ 
                success: true,
                message: 'Secure session cleared'
            });
        } catch (error) {
            console.error('Error clearing secure session:', error);
            res.status(500).json({ error: 'Failed to clear session' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
