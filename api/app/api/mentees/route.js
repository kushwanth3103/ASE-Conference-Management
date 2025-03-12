import { NextResponse } from 'next/server';
import pool from '../lib/db';

export async function GET(request) {
    const connection = await pool.getConnection();
    try {
        const query = `
            SELECT 
                mentees.*,
                mentors.name as mentor_name,
                mentors.email as mentor_email
            FROM mentees 
            LEFT JOIN mentors ON mentees.mentor_id = mentors.mid 
            ORDER BY mentees.created_at DESC
        `;
        const [mentees] = await connection.execute(query);
        return NextResponse.json(mentees);
    } catch (error) {
        console.error('Error fetching mentees:', error);
        return NextResponse.json(
            { message: 'Error fetching mentees' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}

export async function POST(request) {
    const connection = await pool.getConnection();
    try {
        const { name, email, selectedMentor, selectedTime } = await request.json();

        // Validate input
        if (!name || !email || !selectedMentor || !selectedTime) {
            return NextResponse.json(
                { message: 'All fields are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { message: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Get mentor ID from name
        const [mentors] = await connection.execute(
            'SELECT mid FROM mentors WHERE name = ?',
            [selectedMentor]
        );

        if (mentors.length === 0) {
            return NextResponse.json(
                { message: 'Selected mentor not found' },
                { status: 404 }
            );
        }

        const mentorId = mentors[0].mid;

        // Check if time slot is available
        const [existingBookings] = await connection.execute(
            'SELECT * FROM mentees WHERE mentor_id = ? AND time_slot = ? AND status != ?',
            [mentorId, selectedTime, 'rejected']
        );

        if (existingBookings.length > 0) {
            return NextResponse.json(
                { message: 'Selected time slot is already booked' },
                { status: 400 }
            );
        }

        // Insert new mentee registration
        const [result] = await connection.execute(
            `INSERT INTO mentees (name, email, mentor_id, time_slot) 
             VALUES (?, ?, ?, ?)`,
            [name, email, mentorId, selectedTime]
        );

        return NextResponse.json({
            message: 'Mentee registration successful',
            menteeId: result.insertId
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating mentee registration:', error);

        // Handle duplicate email error
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json(
                { message: 'Email already registered' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: 'Error creating mentee registration' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}