import nodemailer from 'nodemailer';

/**
 * FREE Email OTP Service
 * Uses Gmail SMTP - no paid API needed.
 *
 * Setup: https://myaccount.google.com/apppasswords
 * 1. Enable 2FA on Google account
 * 2. Create App Password for "Mail"
 * 3. Add to .env: EMAIL_USER, EMAIL_APP_PASSWORD
 */

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;

function getTransporter() {
    if (!EMAIL_USER || !EMAIL_APP_PASSWORD) return null;
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_APP_PASSWORD,
        },
    });
}

export const otpService = {
    sendOTP: async (email: string, otp: string): Promise<{ sent: boolean }> => {
        const transporter = getTransporter();

        if (!transporter) {
            console.warn('[OTP] Email config missing. OTP for', email, ':', otp);
            return { sent: false };
        }

        try {
            await transporter.sendMail({
                from: `"Chat App" <${EMAIL_USER}>`,
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
};
