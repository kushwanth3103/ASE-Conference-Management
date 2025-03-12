import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function verifyAuth() {
    const headersList =await headers();
    const token = headersList.get('authorization')?.split(' ')[1];

    if (!token) {
        return NextResponse.json(
            { message: 'Authentication required' },
            { status: 401 }
        );
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded)
        return decoded;
    } catch (error) {
        return NextResponse.json(
            { message: 'Invalid token' },
            { status: 401 }
        );
    }
}