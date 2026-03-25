import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-server';
import { emailService } from '@/utils/emailService';

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ message: 'Email is required' }, { status: 400 });
        }

        // Find user by email
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            // Don't reveal if email exists or not for security
            return NextResponse.json({
                message: 'If an account with this email exists, a password reset link has been sent'
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store password reset OTP
        await supabaseAdmin
            .from('users')
            .update({
                password_reset_otp: otp,
                password_reset_otp_expiry: otpExpiry
            })
            .eq('id', user.id);

        // Send email with OTP
        const emailResult = await emailService.sendOTP(email, otp);
        
        if (!emailResult.sent) {
            console.warn('Password reset email not sent:', emailResult.error);
            return NextResponse.json({ 
                message: 'Failed to send password reset email',
                error: emailResult.error
            }, { status: 500 });
        }

        console.log(`Password reset OTP sent to ${email}: ${otp}`);

        return NextResponse.json({
            message: 'If an account with this email exists, a password reset code has been sent'
        });

    } catch (error) {
        console.error('Error sending password reset:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
