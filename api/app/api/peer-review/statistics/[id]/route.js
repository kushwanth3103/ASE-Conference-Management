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

        // Check if user is authorized to view statistics
        const [submission] = await connection.execute(
            'SELECT uid FROM submissions WHERE pid = ?',
            [id]
        );

        if (submission.length === 0) {
            return NextResponse.json(
                { message: 'Paper not found' },
                { status: 404 }
            );
        }

        if (submission[0].uid !== user.userId && user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Not authorized to view statistics' },
                { status: 403 }
            );
        }

        const [statistics] = await connection.execute(
            `SELECT 
          COUNT(rid) as total_reviews,
          AVG(overall_evaluation) as avg_evaluation,
          AVG(relevance) as avg_relevance,
          COUNT(CASE WHEN overall_evaluation >= 4 THEN 1 END) as strong_accept,
          COUNT(CASE WHEN overall_evaluation >= 3 AND overall_evaluation < 4 THEN 1 END) as accept,
          COUNT(CASE WHEN overall_evaluation >= 2 AND overall_evaluation < 3 THEN 1 END) as weak_accept,
          COUNT(CASE WHEN overall_evaluation < 2 THEN 1 END) as reject
       FROM reviews 
       WHERE pid = ?`,
            [id]
        );

        return NextResponse.json(statistics[0]);

    } catch (error) {
        console.error('Error fetching paper statistics:', error);
        return NextResponse.json(
            { message: 'Error fetching paper statistics' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}