import { NextResponse } from 'next/server';
import pool from '../../lib/db';


export async function GET(request, { params }) {
    const connection = await pool.getConnection();
    try {
        const { uid } = await params;
        const [registration_typeList] = await connection.execute(
            'SELECT registration_type FROM conference_payments WHERE user_id = ?',
            [uid]
        );
        if (registration_typeList.length == 0) {
            return NextResponse.json(
                { message: 'user not found' },
                { status: 404 }
            );
        }
        if (registration_typeList.length>1) {
            return NextResponse.json(
                { message: 'too many rows' },
                { status: 404 }
            );
        }
        var registration_type = registration_typeList[0].registration_type;

        return NextResponse.json({
            registration_type
        });

    } catch (error) {
        console.error('Error checking registeration type for a user:', error);
        return NextResponse.json(
            { message: 'Error checking registeration type' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
