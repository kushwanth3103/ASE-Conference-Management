import { NextResponse } from 'next/server';
import pool from '../../lib/db';
import { verifyAuth } from '../../lib/auth';

// GET single conference
export async function GET(request, { params }) {
    const connection = await pool.getConnection();
    try {
        const { id } = await params;
        console.log(id)
        const [conferences] = await connection.execute(
            'SELECT conference_ids FROM conference_payments WHERE user_id = ?',
            [id]
        );


        if (conferences.length === 0) {
            return NextResponse.json(
                { message: 'Conference not found' },
                { status: 404 }
            );
        }


        const results = []; // Object to hold query results
        
        
        for (const cid of JSON.parse(conferences[0].conference_ids)) {
            console.log(cid)
            const data = await connection.execute(
            'SELECT name FROM conferences WHERE cid = ?',
            [cid]
        ); 
            results.push({'conferenceName':  data[0][0].name, 'conferenceId': cid});
            
        }
          
          
    

        return NextResponse.json({
            results
            
        });

    } catch (error) {
        console.error('Error fetching conference:', error);
        return NextResponse.json(
            { message: 'Error fetching conference' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
