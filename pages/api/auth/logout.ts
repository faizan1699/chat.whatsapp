import type { NextApiRequest, NextApiResponse } from 'next';
import { clearSession } from '../../../lib/auth-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    clearSession(res);
    
    return res.status(200).json({ message: 'Logged out successfully' });
}
