import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_dont_use_in_production';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { username, email, phoneNumber, password } = req.body;

        if (!username || !password || (!email && !phoneNumber)) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email: email || undefined },
                    { phoneNumber: phoneNumber || undefined }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                username,
                email: email || null,
                phoneNumber: phoneNumber || null,
                password: hashedPassword,
            },
        });

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        const cookie = serialize('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        res.setHeader('Set-Cookie', cookie);
        return res.status(201).json({
            message: 'User created successfully',
            user: { username: user.username, email: user.email, phoneNumber: user.phoneNumber }
        });

    } catch (error: any) {
        console.error('Signup error:', error);
        return res.status(500).json({ message: error.message || 'Error creating user' });
    }
}
