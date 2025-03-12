import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../../lib/db';

export async function POST(request) {
    const connection = await pool.getConnection();
    try {
        const { email, password } = await request.json();

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get user
        const [users] = await connection.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        
        if (users.length === 0) {
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const user = users[0];
        console.log("hahahhahahahha")
        console.log(user)
        // Verify password 
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 401 }
            );
        }
        
        
        // Generate JWT
        const token = jwt.sign(
            { userId: user.uid, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        console.log(token)
        return NextResponse.json({
            token,
            user: {
                userId: user.uid,
                name: user.name,
                email: user.email,
                role: user.role,
                area_of_expertise:user.area_of_expertise
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { message: 'Error during login' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}