import { emailService } from '../utils/emailService';

/**
 * OTP Service - Uses common email service for sending emails
 * Supports both Gmail and custom SMTP configurations
 */

export const otpService = {
    sendOTP: async (email: string, otp: string): Promise<{ sent: boolean }> => {
        try {
            const result = await emailService.sendOTP(email, otp);
            return { sent: result.sent };
        } catch (error) {
            console.error('[OTP] Email send error:', error);
            throw new Error('Failed to send OTP email');
        }
    },

    sendPasswordResetLink: async (email: string, resetToken: string): Promise<{ sent: boolean }> => {
        try {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
            const resetUrl = `${appUrl.startsWith('http') ? appUrl : `https://${appUrl}`}/auth/reset-password?token=${resetToken}`;
            
            const result = await emailService.sendPasswordReset(email, '', resetUrl);
            return { sent: result.sent };
        } catch (error) {
            console.error('[OTP] Reset email error:', error);
            throw new Error('Failed to send reset email');
        }
    },
};
