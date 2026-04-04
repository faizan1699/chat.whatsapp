import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';
import { getAuthUser } from '../../../utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const authUser = getAuthUser(req);
        if (!authUser) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.startsWith('multipart/form-data')) {
            return res.status(400).json({ message: 'Invalid content type' });
        }

        const contentLength = req.headers['content-length'];
        if (contentLength && parseInt(contentLength) > 1 * 1024 * 1024) {
            return res.status(400).json({ message: 'File size must be less than 1MB' });
        }

        const chunks: Buffer[] = [];
        let totalSize = 0;
        const maxSize = 1 * 1024 * 1024;

        for await (const chunk of req) {
            totalSize += chunk.length;
            if (totalSize > maxSize) {
                return res.status(400).json({ message: 'File size must be less than 1MB' });
            }
            chunks.push(chunk);
        }

        const buffer = Buffer.concat(chunks);
        
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const filename = `chat-files/${authUser.userId}/${timestamp}-${randomString}`;
        
        let fileType = 'application/octet-stream';
        let isImage = false;
        
        if (buffer.length >= 4) {
            const header = buffer.subarray(0, 4);
            const headerHex = header.toString('hex');
            
            if (headerHex.startsWith('ffd8')) {
                fileType = 'image/jpeg';
                isImage = true;
            }
            else if (headerHex.startsWith('89504e47')) {
                fileType = 'image/png';
                isImage = true;
            }
            else if (headerHex.startsWith('47494638')) {
                fileType = 'image/gif';
                isImage = true;
            }
            else if (buffer.length >= 12 && buffer.subarray(0, 12).toString('ascii').includes('WEBP')) {
                fileType = 'image/webp';
                isImage = true;
            }
            else if (buffer.length >= 4 && buffer.subarray(0, 4).toString('ascii') === '%PDF') {
                fileType = 'application/pdf';
            }
            else if (buffer.subarray(0, 1000).toString('utf8').indexOf('\0') === -1) {
                fileType = 'text/plain';
            }
        }

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('chat-files')
            .upload(filename, buffer, {
                contentType: fileType,
                upsert: false
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return res.status(500).json({ message: 'Failed to upload file' });
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('chat-files')
            .getPublicUrl(filename);

        return res.status(200).json({
            message: 'File uploaded successfully',
            file: {
                url: publicUrl,
                filename: filename.split('/').pop() || '',
                size: buffer.length,
                type: fileType,
                isImage: isImage
            }
        });

    } catch (error: unknown) {
        console.error('File upload error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
