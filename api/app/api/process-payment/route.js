import {NextResponse} from 'next/server';
import pool from '../lib/db';
import { verifyAuth } from '../lib/auth';

export async function POST(request) {
    const connection = await pool.getConnection();
    try {
        const data = await request.json();
        

        const {
            conferences,
            type: registrationType,
            fee: payment_amount,
            email,
            cardDetails
        } = data;

        // Input validation
        if (!conferences) {
            console.log('Missing conferences');
            return NextResponse.json(
                {message: 'Missing conferences'},
                {status: 400}
            );
        }

        if (conferences.length === 0) {
            console.log('Conferences array is empty');
            return NextResponse.json(
                {message: 'Conferences array is empty'},
                {status: 400}
            );
        }

        if (!registrationType) {
            console.log('Missing registration type');
            return NextResponse.json(
                {message: 'Missing registration type'},
                {status: 400}
            );
        }

        if (!payment_amount) {
            console.log('Missing payment amount');
            return NextResponse.json(
                {message: 'Missing payment amount'},
                {status: 400}
            );
        }

        if (!email) {
            console.log('Missing email');
            return NextResponse.json(
                {message: 'Missing email'},
                {status: 400}
            );
        }

        if (!cardDetails) {
            console.log('Missing card details');
            return NextResponse.json(
                {message: 'Missing card details'},
                {status: 400}
            );
        }

        // Validate conference IDs
        const conferenceIds = conferences.map(c => c.id).filter(Boolean);
        if (conferenceIds.length === 0) {
            console.log('Invalid conference IDs');
            return NextResponse.json(
                {message: 'Invalid conference IDs'},
                {status: 400}
            );
        }

        // Get user ID from email
        const [users] = await connection.execute(
            'SELECT uid FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return NextResponse.json(
                {message: 'User not found'},
                {status: 404}
            );
        }

        const userId = users[0].uid;

        // Verify that all conferences exist
        for (const id of conferenceIds) {
            const [conferences] = await connection.execute(
                'SELECT cid FROM conferences WHERE cid = ?',
                [id]
            );

            if (conferences.length === 0) {
                return NextResponse.json(
                    {message: 'One or more selected conferences do not exist'},
                    {status: 400}
                );
            }
        }
        
        console.log(conferenceIds);

        // Generate a transaction ID
        const transactionId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5);

        // Create payment record with stringified array of conference IDs
        const [result] = await connection.execute(
            `INSERT INTO conference_payments (user_id,
                                              conference_ids,
                                              payment_amount,
                                              payment_status,
                                              registration_type,
                                              card_last_four,
                                              card_holder,
                                              transaction_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                JSON.stringify(conferenceIds), // Store just the array of IDs
                payment_amount,
                'completed',
                registrationType,
                cardDetails.number,
                cardDetails.name,
                transactionId
            ]
        );

        // For successful payment
        return NextResponse.json({
            message: 'Payment processed successfully',
            paymentId: result.insertId,
            transactionId
        }, {status: 200});

    } catch (error) {
        console.error('Error processing payment:', error);

        // Handle specific database errors
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json(
                {message: 'Duplicate transaction'},
                {status: 400}
            );
        }

        return NextResponse.json(
            {message: 'Error processing payment'},
            {status: 500}
        );
    } finally {
        connection.release();
    }
}

// API endpoint to get user's registered conferences
export async function GET(request) {
    const connection = await pool.getConnection();
    try {
        // Extract user_id from the query parameters
        const user= await verifyAuth(request);
        
        const userId=user.userId;
        
        if (!user) {
            return NextResponse.json(
                { message: 'User ID is required' },
                { status: 400 }
            );
        }

        // Query to fetch conference_ids and registration_type for the given user_id
        const query = `
            SELECT conference_ids, registration_type
            FROM conference_payments
            WHERE user_id = ?
        `;
        const [rows] = await connection.execute(query, [userId]);
        
        // Format and return the data
        return NextResponse.json(rows, { status: 200 });
    } catch (error) {
        console.error('Error fetching conference payments:', error);
        return NextResponse.json(
            { message: 'Error fetching conference payments' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}