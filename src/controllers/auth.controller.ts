import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/email.js';

// In-memory store for OTPs: { "email": { otp: "123456", expires: timestamp } }
const otpStore = new Map<string, { otp: string, expires: number }>();

export const loginAdmin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Check for hardcoded admin credentials
        if (
            email === process.env.adminEmail &&
            password === process.env.adminPassword
        ) {
            // Generate 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();

            // Store OTP with 5 minute expiration
            otpStore.set(email, {
                otp,
                expires: Date.now() + 5 * 60 * 1000
            });

            console.log(`Debug: OTP for ${email} is ${otp}`); // Remove in production

            // Send OTP via Email
            try {
                await sendEmail({
                    email,
                    subject: 'Admin Login OTP - Pest Control',
                    message: `Your login OTP is: ${otp}. It is valid for 5 minutes.`,
                    html: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                            <h2>Admin Login Verification</h2>
                            <p>Your One-Time Password (OTP) for login is:</p>
                            <h1 style="color: #4CAF50; letter-spacing: 5px;">${otp}</h1>
                            <p>This code is valid for 5 minutes.</p>
                           </div>`
                });

                return res.status(200).json({
                    success: true,
                    message: 'OTP sent successfully to your email.',
                    requireOtp: true,
                    email // Return email to confirm where it was sent
                });
            } catch (emailError) {
                console.error('Failed to send OTP email:', emailError);
                return res.status(500).json({
                    success: false,
                    message: 'Credentials valid, but failed to send OTP email.'
                });
            }
        }

        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

export const verifyOtp = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required'
            });
        }

        const storedData = otpStore.get(email);

        if (!storedData) {
            return res.status(400).json({
                success: false,
                message: 'No OTP request found or OTP expired'
            });
        }

        if (Date.now() > storedData.expires) {
            otpStore.delete(email);
            return res.status(400).json({
                success: false,
                message: 'OTP has expired'
            });
        }

        if (storedData.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        // OTP is valid - Clear it and generate token
        otpStore.delete(email);

        const token = jwt.sign(
            {
                id: 'admin',
                email: email,
                role: 'admin',
                name: 'Admin User'
            },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '24h' }
        );

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: 'admin',
                name: 'Admin User',
                email: email,
                role: 'admin'
            }
        });

    } catch (error) {
        console.error('OTP Verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during OTP verification'
        });
    }
};
