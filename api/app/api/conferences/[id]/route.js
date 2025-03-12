import { NextResponse } from 'next/server';
import pool from '../../lib/db';
import { verifyAuth } from '../../lib/auth';

// GET single conference
export async function GET(request, { params }) {
    const connection = await pool.getConnection();
    try {
        const { id } = await params;
        console.log('user id is'+id)
        const [conferences] = await connection.execute(
            'SELECT * FROM conferences WHERE cid = ?',
            [id]
        );

        if (conferences.length === 0) {
            return NextResponse.json(
                { message: 'Conference not found' },
                { status: 404 }
            );
        }

        const [speakers] = await connection.execute(
            'SELECT * FROM speakers WHERE cid = ?',
            [id]
        );

        return NextResponse.json({
            ...conferences[0],
            speakers
        });

    } catch (error) {
        console.error('Error fetching conference:', error);
        return NextResponse.json(
            { message: 'Error fetching conference' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}

// PUT update conference
export async function PUT(request, { params }) {
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

        const { id } = params;
        const {
            conferenceName,
            description,
            date,
            email,
            phone_number,
            speakers
        } = await request.json();

        // Update conference details
        await connection.execute(
            `UPDATE conferences 
       SET name = ?, description = ?, conf_date = ?, 
           email = ?, phone_number = ?
       WHERE cid = ?`,
            [conferenceName, description, date, email, phone_number, id]
        );

        // Delete existing speakers
        await connection.execute(
            'DELETE FROM speakers WHERE cid = ?',
            [id]
        );

        // Insert updated speakers
        for (const speaker of speakers) {
            await connection.execute(
                `INSERT INTO speakers (cid, name, bio, email, description, 
            session_title, discussion_topic, start_time, end_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
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
            message: 'Conference updated successfully'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error updating conference:', error);
        return NextResponse.json(
            { message: 'Error updating conference' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}

// DELETE conference
export async function DELETE(request, { params }) {
    const connection = await pool.getConnection();
    try {
        const user = await verifyAuth();
        if (!user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = params;

        // Speakers will be automatically deleted due to ON DELETE CASCADE
        await connection.execute(
            'DELETE FROM conferences WHERE cid = ?',
            [id]
        );

        return NextResponse.json({
            message: 'Conference deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting conference:', error);
        return NextResponse.json(
            { message: 'Error deleting conference' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}