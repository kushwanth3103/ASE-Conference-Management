import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '../../lib/db';

export async function POST(request) {
    const connection = await pool.getConnection();
    try {
        const { name, email, phone, password, areaOfExpertise } = await request.json();

        // Validate input
        if (!name || !email || !password) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if user exists
        const [existingUsers] = await connection.execute(
            'SELECT email FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return NextResponse.json(
                { message: 'Email already registered' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await connection.execute(
            'INSERT INTO users (name, email, phone_no, password, area_of_expertise) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone, hashedPassword, areaOfExpertise]
        );

        return NextResponse.json({
            message: 'User registered successfully',
            userId: result.insertId
        }, { status: 201 });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { message: 'Error registering user' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
