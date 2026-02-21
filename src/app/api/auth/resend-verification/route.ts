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
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Update user with new OTP
        await supabaseAdmin
            .from('users')
            .update({
                email_otp: otp,
                email_otp_expiry: otpExpiry
            })
            .eq('id', user.id);

        // Send email with OTP
        const emailResult = await emailService.sendOTP(email, otp);
        
        if (!emailResult.sent) {
            return NextResponse.json({ 
                message: 'Failed to send verification email',
                error: emailResult.error
            }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Verification email sent successfully'
        });

    } catch (error) {
        console.error('Error sending verification email:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
