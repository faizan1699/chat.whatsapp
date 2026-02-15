import axios from 'axios';

/**
 * WhatsApp Business API Service (Cloud API)
 * To use this, you need:
 * 1. Meta Developer Account
 * 2. WhatsApp Business App ID
 * 3. Permanent Access Token
 * 4. Registered Phone Number ID
 * 5. Approved Message Template (e.g., 'otp_verification')
 */

const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const API_VERSION = 'v18.0';

export const whatsappService = {
    /**
     * Sends an OTP using a pre-approved template.
     * Template name example: 'auth_otp'
     * Template body: 'Your verification code is {{1}}.'
     */
    sendOTP: async (phoneNumber: string, otp: string) => {
        // Standardize phone number (remove +, spaces, etc.) - must have country code
        const cleanNumber = phoneNumber.replace(/\D/g, '');

        if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
            console.warn('WhatsApp credentials missing. Mocking OTP send for:', cleanNumber);
            return { status: 'mocked', otp };
        }

        try {
            const response = await axios.post(
                `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to: cleanNumber,
                    type: 'template',
                    template: {
                        name: 'auth_otp', // Replace with your approved template name
                        language: {
                            code: 'en_US',
                        },
                        components: [
                            {
                                type: 'body',
                                parameters: [
                                    {
                                        type: 'text',
                                        text: otp,
                                    },
                                ],
                            },
                            {
                                type: 'button',
                                sub_type: 'url',
                                index: '0',
                                parameters: [
                                    {
                                        type: 'text',
                                        text: otp,
                                    },
                                ],
                            },
                        ],
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('WhatsApp API Error:', error.response?.data || error.message);
            throw new Error('Failed to send WhatsApp message');
        }
    },
};

/**
 * INSTRUCTIONS FOR USER:
 * 1. Go to developers.facebook.com
 * 2. Create an App -> Type: Business
 * 3. Add 'WhatsApp' product.
 * 4. In WhatsApp -> Configuration:
 *    - Add a test phone number.
 *    - Create a Message Template called 'auth_otp' in the WhatsApp Manager.
 *    - Wait for approval (usually few minutes).
 *    - Use the 'Phone Number ID' and 'Temporary/Permanent Access Token' in your .env
 */
