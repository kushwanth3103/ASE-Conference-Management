import pool from '../../lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { conference_name, rec_url, date } = await req.json();

    // Find the conference ID (cid) based on the conference name
    const [conference] = await pool.query(`SELECT cid FROM conferences WHERE name = ?`, [conference_name]);

    if (conference.length === 0) {
      return NextResponse.json({ message: 'Conference not found' }, { status: 404 });
    }

    const cid = conference[0].cid;

    // Insert the recording with the retrieved cid
    const [result] = await pool.query(
      `INSERT INTO conf_recordings (cid, rec_url, date) VALUES (?, ?, ?)`,
      [cid, rec_url, date]
    );

    return NextResponse.json({
      message: 'Recording added successfully',
      rec_id: result.insertId,
    });
  } catch (error) {
    console.error('Error inserting recording:', error);
    return NextResponse.json(
      { message: 'Error inserting recording', error: error.message },
      { status: 500 }
    );
  }
}
