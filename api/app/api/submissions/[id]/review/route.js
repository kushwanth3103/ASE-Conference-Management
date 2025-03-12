import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { verifyAuth } from '../../../lib/auth';

export async function POST(request, { params }) {
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
        const { overallEvaluation, relevance, comments } = await request.json();

        // Check if submission exists
        const [submissions] = await connection.execute(
            'SELECT status FROM submissions WHERE pid = ?',
            [id]
        );

        if (submissions.length === 0) {
            return NextResponse.json(
                { message: 'Submission not found' },
                { status: 404 }
            );
        }

        // Check if user has already reviewed this paper
        const [existingReviews] = await connection.execute(
            'SELECT rid FROM reviews WHERE pid = ? AND reviewer_id = ?',
            [id, user.userId]
        );

        if (existingReviews.length > 0) {
            return NextResponse.json(
                { message: 'You have already reviewed this paper' },
                { status: 400 }
            );
        }

        // Submit review
        await connection.execute(
            `INSERT INTO reviews (pid, reviewer_id, overall_evaluation, relevance, comments)
       VALUES (?, ?, ?, ?, ?)`,
            [id, user.userId, overallEvaluation, relevance, comments]
        );

        // Update submission status
        await connection.execute(
            'UPDATE submissions SET status = ? WHERE pid = ?',
            ['under_review', id]
        );

        return NextResponse.json({
            message: 'Review submitted successfully'
        });

    } catch (error) {
        console.error('Error submitting review:', error);
        return NextResponse.json(
            { message: 'Error submitting review' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}