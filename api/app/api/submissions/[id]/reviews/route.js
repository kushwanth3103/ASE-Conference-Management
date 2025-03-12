import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { verifyAuth } from '../../../lib/auth';

export async function GET(request, { params }) {
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

        // Check if user is authorized to view reviews
        const [submissions] = await connection.execute(
            'SELECT uid FROM submissions WHERE pid = ?',
            [id]
        );

        if (submissions.length === 0) {
            return NextResponse.json(
                { message: 'Submission not found' },
                { status: 404 }
            );
        }

        if (submissions[0].uid !== user.userId && user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Not authorized to view reviews' },
                { status: 403 }
            );
        }

        const [reviews] = await connection.execute(
            `SELECT r.*, u.name as reviewer_name
       FROM reviews r
       LEFT JOIN users u ON r.reviewer_id = u.uid
       WHERE r.pid = ?
       ORDER BY r.review_date DESC`,
            [id]
        );

        return NextResponse.json(reviews);

    } catch (error) {
        console.error('Error fetching reviews:', error);
        return NextResponse.json(
            { message: 'Error fetching reviews' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}