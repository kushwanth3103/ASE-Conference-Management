import { NextResponse } from 'next/server';
import pool from '../../../lib/db'; // Import your database connection

export async function POST(req, { params }) {
    const { id } =await  params; // Extract mentor ID from the route params
    const { day, startTime, endTime } = await req.json(); // Extract working hours data from the request body

    const connection = await pool.getConnection(); // Establish database connection
    try {
        // Insert working hours into the `mentor_working_hours` table
        const [result] = await connection.execute(
            `INSERT INTO mentor_working_hours (mentor_id, day, start_time, end_time) VALUES (?, ?, ?, ?)`,
            [id, day, startTime, endTime]
        );

        // Return success response with the inserted working hour ID
        return NextResponse.json(
            {
                message: 'Working hours added successfully',
                workingHourId: result.insertId
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error adding working hours:', error);

        // Return error response in case of failure
        return NextResponse.json(
            {
                message: 'Failed to add working hours',
                error: error.message
            },
            { status: 500 }
        );
    } finally {
        // Release the database connection
        connection.release();
    }
}
