import { NextResponse } from 'next/server';
import pool from '../lib/db';
import { verifyAuth } from '../lib/auth';

// GET all jobs
export async function GET() {
    const connection = await pool.getConnection();
    try {
        // Query to fetch all jobs without any association or ordering by created_at
        const [jobs] = await connection.execute(
            `SELECT * FROM jobs`
        );

        return NextResponse.json(jobs);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        return NextResponse.json(
            { message: 'Error fetching jobs' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}


// POST new job
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

        const { jobTitle, institution, location, link } = await request.json();

        // Validate input
        if (!jobTitle || !institution || !location || !link) {
            return NextResponse.json(
                { message: 'All fields are required' },
                { status: 400 }
            );
        }

        // Insert job
        const [result] = await connection.execute(
            `INSERT INTO jobs (job_title, institution, location, link, posted_by) 
       VALUES (?, ?, ?, ?, ?)`,
            [jobTitle, institution, location, link, 'admin']
        );

        return NextResponse.json({
            message: 'Job posted successfully',
            jobId: result.insertId
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating job:', error);
        return NextResponse.json(
            { message: 'Error posting job' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}