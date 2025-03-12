import { NextResponse } from 'next/server';
import pool from '../../lib/db';
import { verifyAuth } from '../../lib/auth';

export async function GET(request) {
    const connection = await pool.getConnection();
    try {
        const user = await verifyAuth();
        if (!user || !('userId' in user)) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const [users] = await connection.execute(
            'SELECT uid, name, email, phone_no, area_of_expertise, role FROM users WHERE uid = ?',
            [user.userId]
        );

        if (users.length === 0) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ user: users[0] });

    } catch (error) {
        console.error('Get profile error:', error);
        return NextResponse.json(
            { message: 'Error fetching user profile' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}