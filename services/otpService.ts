import nodemailer from 'nodemailer';

/**
 * Email OTP - Nodemailer (FREE)
 *
 * Gmail: EMAIL_USER + EMAIL_APP_PASSWORD
 * Custom SMTP: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
 */

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;

function getTransporter(): nodemailer.Transporter | null {
    // Gmail (simple)
    if (EMAIL_USER && EMAIL_APP_PASSWORD) {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: { user: EMAIL_USER, pass: EMAIL_APP_PASSWORD },
        });
    }
    // Custom SMTP (Outlook, Yahoo, etc.)
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
        return nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_PORT === 465,
            auth: { user: SMTP_USER, pass: SMTP_PASS },
        });
    }
    return null;
}

export const otpService = {
    sendOTP: async (email: string, otp: string): Promise<{ sent: boolean }> => {
        const transporter = getTransporter();

        if (!transporter) {
            console.warn('[OTP] Email config missing. OTP for', email, ':', otp);
            return { sent: false };
        }

        try {
            const fromAddr = EMAIL_FROM || EMAIL_USER || SMTP_USER;
            await transporter.sendMail({
                from: `"Chat App" <${fromAddr}>`,
                to: email,
                subject: 'Your verification code',
                text: `Your verification code is: ${otp}. Valid for 10 minutes.`,
                html: `
                    <div style="font-family:sans-serif;max-width:400px;margin:0 auto;">
                        <h2>Verification Code</h2>
                        <p>Your OTP is: <strong style="font-size:24px;letter-spacing:4px;">${otp}</strong></p>
                        <p style="color:#666;font-size:12px;">Valid for 10 minutes. Do not share with anyone.</p>
                    </div>
                `,
            });
            return { sent: true };
        } catch (error) {
            console.error('[OTP] Email send error:', error);
            throw new Error('Failed to send OTP email');
        }
    },

    sendPasswordResetLink: async (email: string, resetToken: string): Promise<{ sent: boolean }> => {
        const transporter = getTransporter();
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
        const resetUrl = `${appUrl.startsWith('http') ? appUrl : `https://${appUrl}`}/auth/reset-password?token=${resetToken}`;

        if (!transporter) {
            console.warn('[OTP] Email config missing. Reset link for', email, ':', resetUrl);
            return { sent: false };
        }

        try {
            const fromAddr = EMAIL_FROM || EMAIL_USER || SMTP_USER;
            await transporter.sendMail({
                from: `"Chat App" <${fromAddr}>`,
                to: email,
                subject: 'Reset your password',
                text: `Click to reset password: ${resetUrl}\nValid for 1 hour.`,
                html: `
                    <div style="font-family:sans-serif;max-width:400px;margin:0 auto;">
                        <h2>Reset Password</h2>
                        <p>Click the button below to reset your password:</p>
                        <p><a href="${resetUrl}" style="display:inline-block;background:#00a884;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;margin:16px 0;">Reset Password</a></p>
                        <p style="color:#666;font-size:12px;">Valid for 1 hour. If you didn't request this, ignore this email.</p>
                    </div>
                `,
            });
            return { sent: true };
        } catch (error) {
            console.error('[OTP] Reset email error:', error);
            throw new Error('Failed to send reset email');
        }
    },
};
