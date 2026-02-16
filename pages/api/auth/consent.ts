import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_dont_use_in_production';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { termsAccepted, cookieConsent } = req.body;

        // Get token from cookies
        const token = req.cookies['auth-token'];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Verify token and get user ID
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        const userId = decoded.userId;

        // Prepare update data
        const updateData: any = {
            updatedAt: new Date().toISOString()
        };

        if (termsAccepted !== undefined) {
            updateData.termsAccepted = termsAccepted;
            updateData.termsAcceptedAt = termsAccepted ? new Date().toISOString() : null;
        }

        if (cookieConsent !== undefined) {
            updateData.cookieConsent = cookieConsent;
            updateData.cookieConsentAt = new Date().toISOString();
        }

        // Update user record
        const { data, error } = await supabaseAdmin
            .from('users')
            .update(updateData)
            .eq('id', userId)
            .select('id, username, email, termsAccepted, termsAcceptedAt, cookieConsent, cookieConsentAt')
            .single();

        if (error) throw error;

        return res.status(200).json({
            message: 'Consent updated successfully',
            user: data
        });

    } catch (error: unknown) {
        console.error('Consent update error:', error);
        
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        
        return res.status(500).json({ message: 'Internal server error' });
    }
}
