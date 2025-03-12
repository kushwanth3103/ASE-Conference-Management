import { NextResponse } from 'next/server';
import pool from '../lib/db';
import { v4 } from "uuid";

// GET all announcements
export async function GET(request) {
    const connection = await pool.getConnection();
    try {
        // Define a query that only selects data from the announcements table
        let query = `SELECT * FROM announcements ORDER BY posted_at DESC`;

        // Execute the query without any association with the users table or posted_by
        const [announcements] = await connection.execute(query);

        return NextResponse.json(announcements);
    } catch (error) {
        console.error('Error fetching announcements:', error);
        return NextResponse.json(
            { message: 'Error fetching announcements' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}


// POST new article
export async function POST(request) {
    const connection = await pool.getConnection();
    try {

        const { announcement } = await request.json();

        // Validate input
        if (!announcement) {
            return NextResponse.json(
                { message: 'All fields are required' },
                { status: 400 }
            );
        }

        // Insert article
        const [result] = await connection.execute(
            `INSERT INTO announcements (aid, announcement) 
       VALUES (?, ?)`,
            [v4(), announcement]
        );
        console.log(result)
        return NextResponse.json({
            message: 'Announcement created successfully'
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating Announcement:', error);
        return NextResponse.json(
            { message: 'Error creating Announcement' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}