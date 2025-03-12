import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function POST(req, { params }) {
    const { id } = await params; // Extract mentorId from route parameters
    const { userId, workingHourId } = await req.json(); // Extract request body parameters
    console.log('Received userId:', userId); // Debugging
    console.log('Received workingHourId:', workingHourId); // Debugging
    const connection = await pool.getConnection(); // Establish a database connection
    
    try {
        // Check if the slot is available
        const [slot] = await connection.execute(
            `SELECT * FROM mentor_working_hours WHERE id = ? AND is_booked = FALSE`,
            [workingHourId]
        );

        if (!slot.length) {
            return NextResponse.json(
                { message: 'This slot is already booked or does not exist' },
                { status: 400 }
            );
        }

        // Mark the slot as booked
        await connection.execute(
            `UPDATE mentor_working_hours SET is_booked = TRUE WHERE id = ?`,
            [workingHourId]
        );

        // Insert booking into `mentor_bookings` table
        await connection.execute(
            `INSERT INTO mentor_bookings (user_id, mentor_id, working_hour_id) 
             VALUES (?, ?, ?)`,
            [userId, id, workingHourId]
        );

        // Return success response
        return NextResponse.json(
            { message: 'Slot booked successfully!!!!!' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error booking slot:', error);

        // Return error response
        return NextResponse.json(
            { message: 'Failed to book slot', error: error.message },
            { status: 500 }
        );
    } finally {
        // Release the database connection
        connection.release();
    }
}
