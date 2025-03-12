import { NextResponse } from 'next/server';
import pool from '../lib/db';
import { verifyAuth } from '../lib/auth';

// GET all articles
export async function GET(request) {
    const connection = await pool.getConnection();
    try {
        // Define a query that only selects data from the articles table
        let query = `SELECT * FROM articles ORDER BY posted_at DESC`;

        // Execute the query without any association with the users table or posted_by
        const [articles] = await connection.execute(query);

        return NextResponse.json(articles);
    } catch (error) {
        console.error('Error fetching articles:', error);
        return NextResponse.json(
            { message: 'Error fetching articles' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}


// POST new article
export async function POST(request) {
    const connection = await pool.getConnection();
    try {
        const user = await verifyAuth();
        if (!user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { name, description, link } = await request.json();

        // Validate input
        if (!name || !description || !link) {
            return NextResponse.json(
                { message: 'All fields are required' },
                { status: 400 }
            );
        }

        // Insert article
        const [result] = await connection.execute(
            `INSERT INTO articles (title, description, link, posted_by) 
       VALUES (?, ?, ?, ?)`,
            [name, description, link, 'admin']
        );

        return NextResponse.json({
            message: 'Article created successfully',
            articleId: result.insertId
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating article:', error);
        return NextResponse.json(
            { message: 'Error creating article' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}