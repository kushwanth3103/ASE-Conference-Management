import { NextResponse } from 'next/server';
import { join } from 'path';
import { writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import pool from '../lib/db';
import { verifyAuth } from '../lib/auth';
import { UPLOAD_DIR, parseFormData } from '../lib/upload';

// POST new submission
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
        console.log(user)
        // Parse multipart form data
        const { file, data } = await parseFormData(request);
        const { paperTitle, abstract, keywords, conference } = data;

        // Generate unique filename
        const fileExt = '.pdf';
        const fileName = `${uuidv4()}${fileExt}`;
        const filePath = join(UPLOAD_DIR, fileName);

        // Save file
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);

        // Save submission to database
        const [result] = await connection.execute(
            `INSERT INTO submissions (uid, cid, title, abstract, keywords, file_location) 
       VALUES (?, ?, ?, ?, ?, ?)`,
            [user.userId, conference, paperTitle, abstract, keywords, fileName]
        );

        return NextResponse.json({
            message: 'Paper submitted successfully',
            submissionId: result.insertId
        }, { status: 201 });

    } catch (error) {
        console.error('Error submitting paper:', error);
        return NextResponse.json(
            { message: error.message || 'Error submitting paper' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}

// GET user's submissions
export async function GET(request) {
    const connection = await pool.getConnection();
    try {
        const user = await verifyAuth();
        if (!user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const [submissions] = await connection.execute(
            `SELECT s.*, c.name as conference_name,
          COUNT(r.rid) as review_count,
          AVG(r.overall_evaluation) as avg_evaluation
       FROM submissions s
       LEFT JOIN conferences c ON s.cid = c.cid
       LEFT JOIN reviews r ON s.pid = r.pid
       WHERE s.uid = ?
       GROUP BY s.pid
       ORDER BY s.submission_date DESC`,
            [user.userId]
        );

        return NextResponse.json(submissions);

    } catch (error) {
        console.error('Error fetching submissions:', error);
        return NextResponse.json(
            { message: 'Error fetching submissions' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}