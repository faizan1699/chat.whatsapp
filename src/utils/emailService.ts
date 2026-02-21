import nodemailer from 'nodemailer';

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;

interface EmailData {
    to: string;
    subject: string;
    template?: 'otp' | 'verification' | 'password-reset' | 'welcome' | 'custom';
    data?: Record<string, any>;
    text?: string;
    html?: string;
}

interface EmailTemplate {
    subject: string;
    text: (data: any) => string;
    html: (data: any) => string;
}

const emailTemplates: Record<string, EmailTemplate> = {
    otp: {
        subject: 'Your verification code',
        text: (data) => `Your verification code is: ${data.otp}. Valid for 10 minutes.`,
        html: (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="color: #00a884; margin: 0;">Verification Code</h2>
                </div>
                <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center; margin: 20px 0;">
                    <p style="margin: 0 0 15px 0; color: #666;">Your OTP is:</p>
                    <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #00a884; background: white; padding: 20px; border-radius: 8px; display: inline-block;">
                        ${data.otp}
                    </div>
                </div>
                <p style="color: #666; font-size: 14px; text-align: center; margin: 20px 0;">
                    Valid for 10 minutes. Do not share this code with anyone.
                </p>
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #999; font-size: 12px; margin: 0;">Chat App Team</p>
                </div>
            </div>
        `
    },
    verification: {
        subject: 'Verify your email address',
        text: (data) => `Please verify your email by clicking: ${data.verificationLink}`,
        html: (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="color: #00a884; margin: 0;">Verify Your Email</h2>
                </div>
                <p style="color: #333; line-height: 1.6;">
                    Hi ${data.username || 'there'},<br><br>
                    Thank you for signing up! Please click the button below to verify your email address:
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${data.verificationLink}" 
                       style="display: inline-block; background: #00a884; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                        Verify Email
                    </a>
                </div>
                <p style="color: #666; font-size: 14px; text-align: center;">
                    If the button doesn't work, copy and paste this link:<br>
                    <span style="word-break: break-all; color: #00a884;">${data.verificationLink}</span>
                </p>
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #999; font-size: 12px; margin: 0;">Chat App Team</p>
                </div>
            </div>
        `
    },
    'password-reset': {
        subject: 'Reset your password',
        text: (data) => `Click to reset password: ${data.resetLink}\nValid for 1 hour.`,
        html: (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="color: #dc3545; margin: 0;">Reset Password</h2>
                </div>
                <p style="color: #333; line-height: 1.6;">
                    Hi ${data.username || 'there'},<br><br>
                    We received a request to reset your password. Click the button below to reset it:
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${data.resetLink}" 
                       style="display: inline-block; background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                        Reset Password
                    </a>
                </div>
                <p style="color: #666; font-size: 14px; text-align: center;">
                    If you didn't request this, please ignore this email.<br>
                    Valid for 1 hour.
                </p>
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #999; font-size: 12px; margin: 0;">Chat App Team</p>
                </div>
            </div>
        `
    },
    welcome: {
        subject: 'Welcome to Chat App!',
        text: (data) => `Welcome ${data.username}! Your account has been created successfully.`,
        html: (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="color: #00a884; margin: 0;">Welcome to Chat App!</h2>
                </div>
                <p style="color: #333; line-height: 1.6;">
                    Hi ${data.username || 'there'},<br><br>
                    Welcome to Chat App! Your account has been created successfully. You can now start connecting with friends and family.
                </p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="color: #00a884; margin: 0 0 10px 0;">Quick Tips:</h4>
                    <ul style="color: #666; margin: 0; padding-left: 20px;">
                        <li>Start a new conversation</li>
                        <li>Share photos and files</li>
                        <li>Make voice and video calls</li>
                        <li>Create group chats</li>
                    </ul>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${data.appUrl || 'http://localhost:3000'}" 
                       style="display: inline-block; background: #00a884; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                        Start Chatting
                    </a>
                </div>
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #999; font-size: 12px; margin: 0;">Chat App Team</p>
                </div>
            </div>
        `
    }
};

function getTransporter(): nodemailer.Transporter | null {
    if (EMAIL_USER && EMAIL_APP_PASSWORD) {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: { user: EMAIL_USER, pass: EMAIL_APP_PASSWORD },
        });
    }
    
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

export const emailService = {

    sendEmail: async (emailData: EmailData): Promise<{ sent: boolean; error?: string }> => {
        const transporter = getTransporter();

        if (!transporter) {
            const errorMsg = 'Email service not configured. Please set up email credentials.';
            console.warn('[EmailService]', errorMsg);
            return { sent: false, error: errorMsg };
        }

        try {
            const fromAddr = EMAIL_FROM || EMAIL_USER || SMTP_USER;
            let subject: string;
            let textContent: string;
            let htmlContent: string;

            if (emailData.template && emailTemplates[emailData.template]) {
                const template = emailTemplates[emailData.template];
                subject = emailData.subject || template.subject;
                textContent = template.text(emailData.data || {});
                htmlContent = template.html(emailData.data || {});
            } else {
                // Custom content
                subject = emailData.subject;
                textContent = emailData.text || '';
                htmlContent = emailData.html || textContent.replace(/\n/g, '<br>');
            }

            const mailOptions = {
                from: `"Chat App" <${fromAddr}>`,
                to: emailData.to,
                subject,
                text: textContent,
                html: htmlContent,
            };

            await transporter.sendMail(mailOptions);
            console.log('[EmailService] Email sent successfully to:', emailData.to);
            return { sent: true };

        } catch (error) {
            const errorMsg = `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error('[EmailService]', errorMsg, error);
            return { sent: false, error: errorMsg };
        }
    },

    sendOTP: async (to: string, otp: string) => {
        return emailService.sendEmail({
            to,
            subject: 'Your verification code',
            template: 'otp',
            data: { otp }
        });
    },

    sendVerification: async (to: string, username: string, verificationLink: string) => {
        return emailService.sendEmail({
            to,
            subject: 'Verify your email address',
            template: 'verification',
            data: { username, verificationLink }
        });
    },

    sendPasswordReset: async (to: string, username: string, resetLink: string) => {
        return emailService.sendEmail({
            to,
            subject: 'Reset your password',
            template: 'password-reset',
            data: { username, resetLink }
        });
    },

    sendWelcome: async (to: string, username: string, appUrl?: string) => {
        return emailService.sendEmail({
            to,
            subject: 'Welcome to Chat App!',
            template: 'welcome',
            data: { username, appUrl }
        });
    },

    isConfigured: (): boolean => {
        return getTransporter() !== null;
    }
};

export default emailService;
