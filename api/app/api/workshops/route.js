// app/api/workshops/route.js
import { NextResponse } from 'next/server';
import pool from '../lib/db';
import { verifyAuth } from '../lib/auth';

// GET all workshops
export async function GET(request) {
    const connection = await pool.getConnection();
    try {
        // Define a query that only selects data from the workshops table
        const { searchParams } = new URL(request.url);
        const upcoming = searchParams.get('upcoming');

        let query = `SELECT * FROM workshops`;

        // If 'upcoming' is true, filter by workshop date
        if (upcoming === 'true') {
            query += ` WHERE workshop_date >= CURDATE()`;
        }

        query += ` ORDER BY workshop_date ASC`;

        const [workshops] = await connection.execute(query);

        return NextResponse.json(workshops);
    } catch (error) {
        console.error('Error fetching workshops:', error);
        return NextResponse.json(
            { message: 'Error fetching workshops' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}


// POST new workshop
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

        const { title, date, description, link } = await request.json();

        // Validate input
        if (!title || !date || !description || !link) {
            return NextResponse.json(
                { message: 'All fields are required' },
                { status: 400 }
            );
        }

        // Insert workshop
        const [result] = await connection.execute(
            `INSERT INTO workshops (title, workshop_date, description, link, created_by) 
       VALUES (?, ?, ?, ?, ?)`,
            [title, date, description, link, 'admin']
        );

        return NextResponse.json({
            message: 'Workshop created successfully',
            workshopId: result.insertId
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating workshop:', error);
        return NextResponse.json(
            { message: 'Error creating workshop' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}