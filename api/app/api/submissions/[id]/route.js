import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import pool from '../../lib/db';
import { verifyAuth } from '../../lib/auth';
import { UPLOAD_DIR } from '../../lib/upload';

// GET single submission
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

        const { id } = await params;

        const [submissions] = await connection.execute(
            `SELECT s.*, c.name as conference_name, u.name as author_name
       FROM submissions s
       LEFT JOIN conferences c ON s.cid = c.cid
       LEFT JOIN users u ON s.uid = u.uid
       WHERE s.pid = ?`,
            [id]
        );

        if (submissions.length === 0) {
            return NextResponse.json(
                { message: 'Submission not found' },
                { status: 404 }
            );
        }

        const submission = submissions[0];

        // Get paper file
        const filePath = join(UPLOAD_DIR, submission.file_location);
        const fileBuffer = await readFile(filePath);

        return NextResponse.json({
            ...submission,
            fileData: fileBuffer.toString('base64')
        });

    } catch (error) {
        console.error('Error fetching submission:', error);
        return NextResponse.json(
            { message: 'Error fetching submission' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}