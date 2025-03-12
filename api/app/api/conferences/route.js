// app/api/conferences/route.js
import { NextResponse } from 'next/server';
import pool from '../lib/db';
import { verifyAuth } from '../lib/auth';

// GET all conferences
export async function GET() {
    const connection = await pool.getConnection();
    try {
        const [conferences] = await connection.execute(
            `SELECT c.*, 
          COUNT(s.sid) as speaker_count
       FROM conferences c
       LEFT JOIN speakers s ON c.cid = s.cid
       GROUP BY c.cid
       ORDER BY c.conf_date DESC`
        );

        return NextResponse.json(conferences);
    } catch (error) {
        console.error('Error fetching conferences:', error);
        return NextResponse.json(
            { message: 'Error fetching conferences' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}

// POST new conference
export async function POST(request) {
    const connection = await pool.getConnection();
    try {
        const user = await verifyAuth();
        if (!user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connection.beginTransaction();

        const {
            conferenceName,
            description,
            date,
            email,
            phone_number,
            speakers,
            conference_link
        } = await request.json();

        // Insert conference
        const [conferenceResult] = await connection.execute(
            `INSERT INTO conferences (name, description, conf_date, email, phone_number,conference_link) 
       VALUES (?, ?, ?, ?, ?,?)`,
            [conferenceName, description, date, email, phone_number,conference_link]
        );

        const conferenceId = conferenceResult.insertId;

        // Insert speakers
        for (const speaker of speakers) {
            await connection.execute(
                `INSERT INTO speakers (cid, name, bio, email, description, 
            session_title, discussion_topic, start_time, end_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    conferenceId,
                    speaker.name,
                    speaker.bio,
                    speaker.email,
                    speaker.description,
                    speaker.session_title,
                    speaker.discussion_topic,
                    speaker.start_time,
                    speaker.end_time
                ]
            );
        }

        await connection.commit();

        return NextResponse.json({
            message: 'Conference created successfully',
            conferenceId
        }, { status: 201 });

    } catch (error) {
        await connection.rollback();
        console.error('Error creating conference:', error);
        return NextResponse.json(
            { message: 'Error creating conference' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}