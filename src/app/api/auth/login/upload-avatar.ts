import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';
import { getAuthUser } from '../../../utils/auth';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Check authentication
    const authUser = getAuthUser(req);
    if (!authUser) {
        return res.status(401).json({ error: 'Unauthorized - Please login' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Handle file upload
        const chunks: any[] = [];
        req.on('data', (chunk) => chunks.push(chunk));
        
        await new Promise((resolve, reject) => {
            req.on('end', resolve);
            req.on('error', reject);
        });

        const buffer = Buffer.concat(chunks);
        
        // Validate file size (10MB max)
        if (buffer.length > 10 * 1024 * 1024) {
            return res.status(400).json({ error: 'File size too large. Maximum 10MB allowed.' });
        }

        const imageSignatures = {
            'image/jpeg': [0xFF, 0xD8, 0xFF],
            'image/png': [0x89, 0x50, 0x4E, 0x47],
            'image/gif': [0x47, 0x49, 0x46],
            'image/webp': [0x52, 0x49, 0x46, 0x46]
        };

        const bufferArray = Array.from(buffer.slice(0, 4));
        let isValidImage = false;
        
        for (const [mimeType, signature] of Object.entries(imageSignatures)) {
            if (signature.every((byte, index) => bufferArray[index] === byte)) {
                isValidImage = true;
                break;
            }
        }

        if (!isValidImage) {
            return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' });
        }
        
        // Convert to base64
        const base64Image = `data:image/jpeg;base64,${buffer.toString('base64')}`;
        
        // Update user profile with new avatar
        const { error } = await supabaseAdmin
            .from('users')
            .update({ 
                avatar: base64Image,
                updated_at: new Date().toISOString()
            })
            .eq('id', authUser.userId);

        if (error) {
            console.error('Error updating avatar:', error);
            return res.status(500).json({ error: 'Failed to update avatar' });
        }

        res.status(200).json({ 
            message: 'Avatar uploaded successfully',
            avatar: base64Image 
        });
        
    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ error: 'Failed to upload avatar' });
    }
}
