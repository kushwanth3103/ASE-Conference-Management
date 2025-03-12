import { NextResponse } from 'next/server';
import pool from '../lib/db';

// GET all contact messages
export async function GET(request) {
    const connection = await pool.getConnection();
    try {
        const query = `SELECT * FROM contact_us ORDER BY created_at DESC`;
        const [contactMessages] = await connection.execute(query);

        return NextResponse.json(contactMessages);
    } catch (error) {
        console.error('Error fetching contact messages:', error);
        return NextResponse.json(
            { message: 'Error fetching contact messages' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}

export async function POST(request) {
    const connection = await pool.getConnection();
    try {
        const { firstName, lastName, email, phoneNumber, subject, message } = await request.json();

        // Validate input
        if (!firstName || !lastName || !email || !subject || !message) {
            return NextResponse.json(
                { message: 'All required fields must be filled' },
                { status: 400 }
            );
        }

        // Insert new contact message
        const [result] = await connection.execute(
            `INSERT INTO contact_us (first_name, last_name, email, phone_number, subject, message) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [firstName, lastName, email, phoneNumber || null, subject, message]
        );

        return NextResponse.json({
            message: 'Contact message sent successfully',
            contactId: result.insertId
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating contact message:', error);
        return NextResponse.json(
            { message: 'Error creating contact message' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
