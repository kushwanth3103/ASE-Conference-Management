import { NextResponse } from 'next/server';
import pool from '../../lib/db';
import { verifyAuth } from '../../lib/auth';

export async function GET() {
    const connection = await pool.getConnection();
    try {
        const user = await verifyAuth();
        if (!user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get user's area of expertise
        const [userInfo] = await connection.execute(
            'SELECT area_of_expertise FROM users WHERE uid = ?',
            [user.userId]
        );

        if (userInfo.length === 0) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        // Get all papers except user's own, including review status
        const [papers] = await connection.execute(
            `SELECT
         s.pid,
         s.title,
         s.abstract,
         s.submission_date,
         s.status,
         c.name as conference_name,
         u.name as author_name,
         COUNT(DISTINCT r.rid) as review_count,
         AVG(r.overall_evaluation) as avg_rating,
         MAX(CASE WHEN r.reviewer_id = ? THEN 1 ELSE 0 END) as has_reviewed
       FROM submissions s
       JOIN conferences c ON s.cid = c.cid
       JOIN users u ON s.uid = u.uid
       LEFT JOIN reviews r ON s.pid = r.pid
       WHERE s.status IN ('pending', 'under_review')
         AND s.uid != ?
       GROUP BY s.pid
       HAVING review_count < 3
       ORDER BY s.submission_date DESC`,
            [user.userId, user.userId]
        );
        
        
        // Get review statistics for each paper
        const papersWithStats = await Promise.all(papers.map(async (paper) => {
            const [reviews] = await connection.execute(
                `SELECT
           COUNT(rid) as total_reviews,
           AVG(overall_evaluation) as avg_evaluation,
           AVG(relevance) as avg_relevance
         FROM reviews
         WHERE pid = ?`,
                [paper.pid]
            );

            // If user has reviewed this paper, get their review
            const [userReview] = await connection.execute(
                `SELECT 
           rid,
           overall_evaluation,
           relevance,
           comments,
           review_date
         FROM reviews 
         WHERE pid = ? AND reviewer_id = ?`,
                [paper.pid, user.userId]
            );

            return {
                ...paper,
                statistics: reviews[0],
                userReview: userReview[0] || null,
                canReview: !paper.has_reviewed && reviews[0].total_reviews < 3
            };
        }));

        return NextResponse.json(papersWithStats);

    } catch (error) {
        console.error('Error fetching assigned papers:', error);
        return NextResponse.json(
            { message: 'Error fetching assigned papers' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}