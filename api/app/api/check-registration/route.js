import { NextResponse } from 'next/server';
import pool from '../lib/db';

export async function GET(request) {
    const connection = await pool.getConnection();
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');
        const conferenceIds = searchParams.get('conferences'); // Expect comma-separated IDs

        if (!email || !conferenceIds) {
            return NextResponse.json(
                { message: 'Email and conference IDs are required' },
                { status: 400 }
            );
        }

        const requestedIds = conferenceIds.split(',').map(id => parseInt(id));

        // Get user's paid conferences with detailed information
        const [payments] = await connection.execute(
            `SELECT
                 cp.payment_id,
                 cp.registration_type,
                 cp.payment_amount,
                 cp.transaction_id,
                 cp.created_at AS payment_date,
                 cp.conference_ids,
                 c.cid,
                 c.name AS conference_name,
                 c.conf_date,
                 c.description
             FROM users u
             JOIN conference_payments cp ON u.uid = cp.user_id
             JOIN conferences c ON FIND_IN_SET(c.cid, cp.conference_ids)
             WHERE u.email = ?
               AND cp.payment_status = 'completed'
             ORDER BY cp.created_at DESC`,
            [email]
        );
        

        // Group conferences by payment
        const groupedPayments = payments.reduce((acc, payment) => {
            const paymentId = payment.payment_id;
            if (!acc[paymentId]) {
                acc[paymentId] = {
                    payment_id: paymentId,
                    registration_type: payment.registration_type,
                    payment_amount: payment.payment_amount,
                    transaction_id: payment.transaction_id,
                    payment_date: payment.payment_date,
                    conferences: []
                };
            }
            acc[paymentId].conferences.push({
                id: payment.cid,
                name: payment.conference_name,
                date: payment.conf_date,
                description: payment.description
            });
            return acc;
        }, {});

        // Check if any of the requested conferences are already registered
        const existingRegistrations = Object.values(groupedPayments).reduce((acc, payment) => {
            payment.conferences.forEach(conf => {
                if (requestedIds.includes(conf.id)) {
                    acc.push({
                        id: conf.id,
                        name: conf.name,
                        registrationType: payment.registration_type,
                        paymentId: payment.payment_id,
                        date: conf.date,
                        registrationDate: payment.payment_date
                    });
                }
            });
            return acc;
        }, []);

        return NextResponse.json({
            hasExistingRegistrations: existingRegistrations.length > 0,
            registeredConferences: existingRegistrations,
            allRegistrations: Object.values(groupedPayments)
        });

    } catch (error) {
        console.error('Error checking registrations:', error);
        return NextResponse.json(
            { message: 'Error checking registrations' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}