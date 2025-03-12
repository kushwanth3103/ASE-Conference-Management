import { NextResponse } from 'next/server';
import pool from '../../../lib/db'; 

export async function GET(req, { params }) {
    const { id } = await params; 

    const connection = await pool.getConnection(); 
    try {

        const [slots] = await connection.execute(
            `SELECT * FROM mentor_working_hours WHERE mentor_id = ? AND is_booked = FALSE`,
            [id]
        );

        // Return the slots as a JSON response
        return NextResponse.json(slots, { status: 200 });
    } catch (error) {
        console.error('Error fetching available slots:', error);

        // Return error response in case of failure
        return NextResponse.json(
            {
                message: 'Failed to fetch available slots',
                error: error.message
            },
            { status: 500 }
        );
    } finally {
        // Release the database connection
        connection.release();
    }
}
