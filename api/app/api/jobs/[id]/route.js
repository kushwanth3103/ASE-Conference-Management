import { NextResponse } from 'next/server';
import pool from '../../lib/db';
import { verifyAuth } from '../../lib/auth';

// GET single job
export async function GET(request, { params }) {
    const connection = await pool.getConnection();
    try {
        const { id } = params;

        const [jobs] = await connection.execute(
            `SELECT j.*, u.name as posted_by_name 
       FROM jobs j 
       LEFT JOIN users u ON j.posted_by = u.uid 
       WHERE j.jid = ?`,
            [id]
        );

        if (jobs.length === 0) {
            return NextResponse.json(
                { message: 'Job not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(jobs[0]);

    } catch (error) {
        console.error('Error fetching job:', error);
        return NextResponse.json(
            { message: 'Error fetching job' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}

// PUT update job
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

        const { id } = params;
        const { jobTitle, institution, location, link } = await request.json();

        // Validate input
        if (!jobTitle || !institution || !location || !link) {
            return NextResponse.json(
                { message: 'All fields are required' },
                { status: 400 }
            );
        }

        // Check if user has permission
        const [jobs] = await connection.execute(
            'SELECT posted_by FROM jobs WHERE jid = ?',
            [id]
        );

        if (jobs.length === 0) {
            return NextResponse.json(
                { message: 'Job not found' },
                { status: 404 }
            );
        }

        if (jobs[0].posted_by !== user.userId) {
            return NextResponse.json(
                { message: 'Not authorized to update this job' },
                { status: 403 }
            );
        }

        // Update job
        await connection.execute(
            `UPDATE jobs 
       SET job_title = ?, institution = ?, location = ?, link = ? 
       WHERE jid = ?`,
            [jobTitle, institution, location, link, id]
        );

        return NextResponse.json({
            message: 'Job updated successfully'
        });

    } catch (error) {
        console.error('Error updating job:', error);
        return NextResponse.json(
            { message: 'Error updating job' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}

// DELETE job
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
        const [jobs] = await connection.execute(
            'SELECT posted_by FROM jobs WHERE jid = ?',
            [id]
        );

        if (jobs.length === 0) {
            return NextResponse.json(
                { message: 'Job not found' },
                { status: 404 }
            );
        }

        if (jobs[0].posted_by !== user.userId && user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Not authorized to delete this job' },
                { status: 403 }
            );
        }

        await connection.execute(
            'DELETE FROM jobs WHERE jid = ?',
            [id]
        );

        return NextResponse.json({
            message: 'Job deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting job:', error);
        return NextResponse.json(
            { message: 'Error deleting job' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}