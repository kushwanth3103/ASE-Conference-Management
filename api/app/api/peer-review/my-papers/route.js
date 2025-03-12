import { NextResponse } from 'next/server';
import pool from '../../lib/db';
import { verifyAuth } from '../../lib/auth';

export async function GET() {
    const connection = await pool.getConnection();
    try {
        const user = await verifyAuth();
        if (!user) {
            return NextResponse.json(
                {message: 'Unauthorized'},
                {status: 401}
            );
        }

        const [submissions] = await connection.execute(
            `SELECT s.pid,
                    s.title,
                    s.abstract,
                    s.status,
                    s.submission_date,
                    c.name                    as conference_name,
                    COUNT(r.rid)              as review_count,
                    AVG(r.overall_evaluation) as avg_evaluation,
                    AVG(r.relevance)          as avg_relevance
             FROM submissions s
                      JOIN conferences c ON s.cid = c.cid
                      LEFT JOIN reviews r ON s.pid = r.pid
             WHERE s.uid = ?
             GROUP BY s.pid
             ORDER BY s.submission_date DESC`,
            [user.userId]
        );

        // Get detailed reviews for each submission
        const submissionsWithReviews = await Promise.all(submissions.map(async (submission) => {
            const [reviews] = await connection.execute(
                `SELECT r.overall_evaluation,
                        r.relevance,
                        r.comments,
                        r.review_date,
                        u.name as reviewer_name
                 FROM reviews r
                          JOIN users u ON r.reviewer_id = u.uid
                 WHERE r.pid = ?
                 ORDER BY r.review_date DESC`,
                [submission.pid]
            );

            return {
                ...submission,
                reviews
            };
        }));

        return NextResponse.json(submissionsWithReviews);

    } catch (error) {
        console.error('Error fetching user paper reviews:', error);
        return NextResponse.json(
            {message: 'Error fetching user paper reviews'},
            {status: 500}
        );
    } finally {
        connection.release();
    }

}