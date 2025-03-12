import { NextResponse } from 'next/server';
import pool from '../lib/db';
import { verifyAuth } from '../lib/auth';

// GET messages for a specific conference
export async function GET(request) {
    const connection = await pool.getConnection();
    try {
        const { searchParams } = new URL(request.url);
        const conferenceId = searchParams.get('conferenceId');

        if (!conferenceId) {
            return NextResponse.json(
                { message: 'Conference ID is required' },
                { status: 400 }
            );
        }

        // Fetch messages for the given conference ID
        const [messages] = await connection.execute(
            `SELECT m.id, m.conference_id, m.sender_id, m.message, m.timestamp, u.name AS sender_name 
             FROM live_chat_messages m
             JOIN users u ON m.sender_id = u.uid
             WHERE m.conference_id = ?
             ORDER BY m.timestamp ASC`,
            [conferenceId]
        );

        return NextResponse.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json(
            { message: 'Error fetching messages' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}

// POST a new message
export async function POST(request) {
    const connection = await pool.getConnection();
    try {
        

        const { conferenceId, message,sender } = await request.json();

        
        // Validate input
        if (!conferenceId || !message) {
            return NextResponse.json(
                { message: 'Conference ID and message are required' },
                { status: 400 }
            );
        }

        // Insert the message
        const [result] = await connection.execute(
            `INSERT INTO live_chat_messages (conference_id, sender_id, message) 
             VALUES (?, ?, ?)`,
            [conferenceId, sender, message]
        );

        return NextResponse.json(
            {
                message: 'Message sent successfully',
                messageId: result.insertId
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error posting message:', error);
        return NextResponse.json(
            { message: 'Error posting message' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
