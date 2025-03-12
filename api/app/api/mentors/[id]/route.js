import { NextResponse } from 'next/server';
import pool from '../../lib/db';
import { verifyAuth } from '../../lib/auth';

// GET single mentor
export async function GET(request, { params }) {
    const connection = await pool.getConnection();
    try {
        const { id } = params;

        const [mentors] = await connection.execute(
            `SELECT m.*, u.email,
          GROUP_CONCAT(DISTINCT c.name) as expertise
       FROM mentors m 
       LEFT JOIN users u ON m.user_id = u.uid
       LEFT JOIN mentor_expertise me ON m.mid = me.mid
       LEFT JOIN conferences c ON me.cid = c.cid
       WHERE m.mid = ?
       GROUP BY m.mid`,
            [id]
        );

        if (mentors.length === 0) {
            return NextResponse.json(
                { message: 'Mentor not found' },
                { status: 404 }
            );
        }

        const mentor = {
            ...mentors[0],
            expertise: mentors[0].expertise ? mentors[0].expertise.split(',') : []
        };

        return NextResponse.json(mentor);

    } catch (error) {
        console.error('Error fetching mentor:', error);
        return NextResponse.json(
            { message: 'Error fetching mentor' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}

// PUT update mentor
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
        const { name, bio, conferences } = await request.json();

        // Validate input
        if (!name || !bio || !conferences || conferences.length === 0) {
            return NextResponse.json(
                { message: 'All fields are required' },
                { status: 400 }
            );
        }

        // Check if user has permission
        const [mentors] = await connection.execute(
            'SELECT user_id FROM mentors WHERE mid = ?',
            [id]
        );

        if (mentors.length === 0) {
            return NextResponse.json(
                { message: 'Mentor not found' },
                { status: 404 }
            );
        }

        if (mentors[0].user_id !== user.userId && user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Not authorized to update this mentor' },
                { status: 403 }
            );
        }

        // Update mentor
        await connection.execute(
            'UPDATE mentors SET name = ?, bio = ? WHERE mid = ?',
            [name, bio, id]
        );

        // Update expertise
        await connection.execute(
            'DELETE FROM mentor_expertise WHERE mid = ?',
            [id]
        );

        for (const conferenceName of conferences) {
            const [confResult] = await connection.execute(
                'SELECT cid FROM conferences WHERE name = ?',
                [conferenceName]
            );

            if (confResult.length > 0) {
                await connection.execute(
                    'INSERT INTO mentor_expertise (mid, cid) VALUES (?, ?)',
                    [id, confResult[0].cid]
                );
            }
        }

        await connection.commit();

        return NextResponse.json({
            message: 'Mentor updated successfully'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error updating mentor:', error);
        return NextResponse.json(
            { message: 'Error updating mentor' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}

// DELETE mentor
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

        // Check if user has permission
        const [mentors] = await connection.execute(
            'SELECT user_id FROM mentors WHERE mid = ?',
            [id]
        );

        if (mentors.length === 0) {
            return NextResponse.json(
                { message: 'Mentor not found' },
                { status: 404 }
            );
        }

        if (mentors[0].user_id !== user.userId && user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Not authorized to delete this mentor' },
                { status: 403 }
            );
        }

        await connection.execute(
            'DELETE FROM mentors WHERE mid = ?',
            [id]
        );

        return NextResponse.json({
            message: 'Mentor deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting mentor:', error);
        return NextResponse.json(
            { message: 'Error deleting mentor' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}