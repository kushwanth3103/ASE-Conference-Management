// app/api/recordings/[cid]/route.js
import pool from '../../lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { cid } = await params; // Get the conference ID from the URL parameters

  try {
    // Query the database to get the recording URL associated with the provided conference ID
    const [recordingData] = await pool.query(
      `SELECT rec_id,rec_url,date FROM conf_recordings WHERE cid = ?`,
      [cid]
    );
    console.log(recordingData)
    // If no recordings are found, respond with a 404 error
    if (recordingData.length === 0) {
      return NextResponse.json(
        { message: 'No recordings found for this conference' },
        { status: 404 }
      );
    }

    // Return the recording URL in JSON format
    return NextResponse.json({ rec_url: recordingData});
  } catch (error) {
    console.error('Error fetching recording:', error);
    return NextResponse.json(
      { message: 'Error fetching recording', error: error.message },
      { status: 500 }
    );
  }
}
