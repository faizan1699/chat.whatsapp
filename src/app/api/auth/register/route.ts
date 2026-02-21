import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../utils/supabase-server';
import bcrypt from 'bcryptjs';
import { emailService } from '../../../../utils/emailService';

export async function POST(req: NextRequest) {
    try {
        const { username, email, password, termsAccepted, cookieConsent } = await req.json();

        if (!username || !email || !password) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        if (!termsAccepted) {
            return NextResponse.json({ message: 'You must accept the terms and conditions' }, { status: 400 });
        }

        const { data: existingUsers, error: checkError } = await supabaseAdmin
            .from('users')
            .select('*')
            .or(`username.eq.${username},email.eq.${email}`)
            .limit(1);

        if (checkError) throw checkError;

        if (existingUsers && existingUsers.length > 0) {
            const existingUser = existingUsers[0];
            if (existingUser.username === username) {
                return NextResponse.json({ message: 'Username already exists' }, { status: 409 });
            }
            if (existingUser.email === email) {
                return NextResponse.json({ message: 'Email Not Available' }, { status: 409 });
            }
        }

        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        const { data: newUser, error: createError } = await supabaseAdmin
            .from('users')
            .insert({
                username,
                email,
                password: hashedPassword,
                terms_accepted: termsAccepted,
                terms_accepted_at: new Date().toISOString(),
                cookie_consent: cookieConsent,
                cookie_consent_at: new Date().toISOString(),
                email_verified: false,
                email_otp: otp,
                email_otp_expiry: otpExpiry.toISOString()
            })
            .select('*')
            .single();

        if (createError) throw createError;

        try {
            const emailResult = await emailService.sendOTP(email, otp);
            
            if (!emailResult.sent) {
                console.warn('Email not sent, but OTP generated:', otp);
                return NextResponse.json({ 
                    message: 'Account created but email service not configured',
                    requiresVerification: true,
                    debug: { otp }
                }, { status: 200 });
            }

            return NextResponse.json({
                message: 'Account created successfully. Please check your email for verification code.',
                requiresVerification: true,
                email: email
            });

        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            return NextResponse.json({
                message: 'Account created but failed to send verification email',
                requiresVerification: true,
                email: email,
                debug: { otp }
            }, { status: 200 });
        }

    } catch (error: unknown) {
        console.error('Registration error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
