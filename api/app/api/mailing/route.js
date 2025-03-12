import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { OAuth2 } = google.auth;

const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID;
const CLIENT_SECRET = process.env.NEXT_PUBLIC_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.NEXT_PUBLIC_REFRESH_TOKEN;
const EMAIL = process.env.NEXT_PUBLIC_EMAIL;

// POST: Send an email
export async function POST(request) {
    try {
        const { to, subject, text } = await request.json();

        // Validate input
        if (!to || !subject || !text) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Configure OAuth2 Client
        const oauth2Client = new OAuth2(
            CLIENT_ID,
            CLIENT_SECRET,
            "https://developers.google.com/oauthplayground"
        );

        oauth2Client.setCredentials({
            refresh_token: REFRESH_TOKEN,
        });

        // Get access token
        const accessToken = await oauth2Client.getAccessToken();

        // Configure nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: EMAIL,
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken.token,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });

        // Mail options
        const mailOptions = {
            from: `"Conference Management Portal" <${EMAIL}>`,
            to,
            subject,
            text,
        };
        
        // Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log(info)
        return NextResponse.json({
            message: "Email sent successfully!",
            messageId: info.messageId,
        }, { status: 200 });

    } catch (error) {
        console.error("Error sending email:", error);
        return NextResponse.json(
            { message: "Failed to send email" },
            { status: 500 }
        );
    }
}
