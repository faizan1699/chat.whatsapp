import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-server';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
    try {
        const { email, otp, newPassword } = await req.json();

        if (!email || !otp || !newPassword) {
            return NextResponse.json({ 
                message: 'Email, OTP, and new password are required' 
            }, { status: 400 });
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
        if (!user.password_reset_otp || user.password_reset_otp !== otp) {
            return NextResponse.json({ message: 'Invalid OTP' }, { status: 400 });
        }

        if (!user.password_reset_otp_expiry || new Date() > new Date(user.password_reset_otp_expiry)) {
            return NextResponse.json({ message: 'OTP has expired' }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear reset OTP
        await supabaseAdmin
            .from('users')
            .update({
                password: hashedPassword,
                password_reset_otp: null,
                password_reset_otp_expiry: null,
                updatedAt: new Date().toISOString()
            })
            .eq('id', user.id);

        return NextResponse.json({
            message: 'Password reset successfully'
        });

    } catch (error) {
        console.error('Error resetting password:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
