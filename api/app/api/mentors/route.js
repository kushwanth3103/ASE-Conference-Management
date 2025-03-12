import { NextResponse } from 'next/server';
import pool from '../lib/db';
import { verifyAuth } from '../lib/auth';

// GET all mentors
export async function GET() {
    const connection = await pool.getConnection();
    try {
        const [mentors] = await connection.execute(
            `SELECT m.*, 
            GROUP_CONCAT(DISTINCT c.name) AS expertise
            FROM mentors m
            LEFT JOIN mentor_expertise me ON m.mid = me.mid
            LEFT JOIN conferences c ON me.cid = c.cid
            GROUP BY m.mid;
`
        );

        const formattedMentors = mentors.map(mentor => ({
            ...mentor,
            expertise: mentor.expertise ? mentor.expertise.split(',') : []
        }));

        console.log(formattedMentors)

        return NextResponse.json(formattedMentors);

    } catch (error) {
        console.error('Error fetching mentors:', error);
        return NextResponse.json(
            { message: 'Error fetching mentors' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}

// POST new mentor
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

        const { name, bio, conferences } = await request.json();
        const userId = user.userId;

        // Validate input
        if (!name || !bio || !conferences || conferences.length === 0) {
            return NextResponse.json(
                { message: 'All fields are required' },
                { status: 400 }
            );
        }

        // Insert mentor
        const [mentorResult] = await connection.execute(
            `INSERT INTO mentors (name, bio,role) VALUES (?, ?,?)`,
            [name, bio,'mentor']
        );
        
        

        const mentorId = mentorResult.insertId;

        // Insert mentor expertise
        for (const conferenceName of conferences) {
            const [confResult] = await connection.execute(
                'SELECT cid FROM conferences WHERE name = ?',
                [conferenceName]
            );

            if (confResult.length > 0) {
                await connection.execute(
                    'INSERT INTO mentor_expertise (mid, cid) VALUES (?, ?)',
                    [mentorId, confResult[0].cid]
                );
            }
        }

        await connection.commit();

        return NextResponse.json({
            message: 'Mentor created successfully',
            mentorId
        }, { status: 201 });

    } catch (error) {
        await connection.rollback();
        console.error('Error creating mentor:', error);
        return NextResponse.json(
            { message: 'Error creating mentor' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}