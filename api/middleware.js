import { NextResponse } from 'next/server';

export function middleware(request) {
    // Check if it's an OPTIONS request
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    const response = NextResponse.next();

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
}

export const config = {
    matcher: '/api/:path*',
};