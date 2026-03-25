import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-server';

export async function POST(req: NextRequest) {
    try {
        const { email, otp } = await req.json();

        if (!email || !otp) {
            return NextResponse.json({ message: 'Email and OTP are required' }, { status: 400 });
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

        // Check if OTP matches and is not expired
        if (!user.email_otp || user.email_otp !== otp) {
            return NextResponse.json({ message: 'Invalid OTP' }, { status: 400 });
        }

        if (!user.email_otp_expiry || new Date() > new Date(user.email_otp_expiry)) {
            return NextResponse.json({ message: 'OTP has expired' }, { status: 400 });
        }

        // Mark email as verified
        await supabaseAdmin
            .from('users')
            .update({
                email_verified: true,
                email_verified_at: new Date().toISOString(),
                email_otp: null,
                email_otp_expiry: null
            })
            .eq('id', user.id);

        return NextResponse.json({
            message: 'Email verified successfully'
        });

    } catch (error) {
        console.error('Error verifying OTP:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
