import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';
import bcrypt from 'bcryptjs';
import { whatsappService } from '../../../services/whatsappService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    const { username, email, phoneNumber, password } = req.body;

    if (!username || !password || (!email && !phoneNumber)) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user (marked as pending/unverified if you want to implement double verification)
        // For now, let's just create them and send the OTP
        const user = await prisma.user.create({
            data: {
                username,
                email,
                phoneNumber,
                password: hashedPassword,
            },
        });

        // Send OTP if phone number is provided
        if (phoneNumber) {
            await whatsappService.sendOTP(phoneNumber, otp);
        }

        res.status(201).json({
            message: 'Registration successful. OTP sent via WhatsApp (if phone provided).',
            userId: user.id
        });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Username, email or phone already exists' });
        }
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
