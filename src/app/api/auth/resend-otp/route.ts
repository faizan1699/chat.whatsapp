import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../utils/supabase-server';
import { emailService } from '../../../../utils/emailService';

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Find user by email
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if email is already verified
        if (user.emailVerified) {
            return NextResponse.json({ error: 'Email is already verified' }, { status: 400 });
        }

        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Update user with new OTP
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
                emailOtp: otp,
                emailOtpExpiry: otpExpiry.toISOString(),
                updatedAt: new Date().toISOString()
            })
            .eq('id', user.id);

        if (updateError) throw updateError;

        // Send OTP email
        try {
            const emailResult = await emailService.sendOTP(email, otp);
            
            if (!emailResult.sent) {
                console.warn('Email not sent, but OTP generated:', otp);
                return NextResponse.json({ 
                    message: 'OTP generated but email service not configured',
                    debug: { otp }
                }, { status: 200 });
            }

            return NextResponse.json({ message: 'Verification code sent successfully' });
        } catch (emailError) {
            console.error('Failed to send OTP email:', emailError);
            return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
        }

    } catch (error: unknown) {
        console.error('Resend OTP error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
