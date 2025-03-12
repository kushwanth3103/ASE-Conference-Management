import { NextResponse } from 'next/server';
import pool from '../../lib/db';
import { verifyAuth } from '../../lib/auth';

// GET single article
export async function GET(request, { params }) {
    const connection = await pool.getConnection();
    try {
        const { id } = params;

        const [articles] = await connection.execute(
            `SELECT a.*, u.name as author_name 
       FROM articles a 
       LEFT JOIN users u ON a.posted_by = u.uid 
       WHERE a.aid = ?`,
            [id]
        );

        if (articles.length === 0) {
            return NextResponse.json(
                { message: 'Article not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(articles[0]);

    } catch (error) {
        console.error('Error fetching article:', error);
        return NextResponse.json(
            { message: 'Error fetching article' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}

// PUT update article
export async function PUT(request, { params }) {
    const connection = await pool.getConnection();
    try {
        const user = await verifyAuth();
        if (!user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = params;
        const { name, description, link } = await request.json();

        // Validate input
        if (!name || !description || !link) {
            return NextResponse.json(
                { message: 'All fields are required' },
                { status: 400 }
            );
        }

        // Check if user has permission
        const [articles] = await connection.execute(
            'SELECT posted_by FROM articles WHERE aid = ?',
            [id]
        );

        if (articles.length === 0) {
            return NextResponse.json(
                { message: 'Article not found' },
                { status: 404 }
            );
        }

        if (articles[0].posted_by !== user.userId && user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Not authorized to update this article' },
                { status: 403 }
            );
        }

        // Update article
        await connection.execute(
            `UPDATE articles 
       SET title = ?, description = ?, link = ? 
       WHERE aid = ?`,
            [name, description, link, id]
        );

        return NextResponse.json({
            message: 'Article updated successfully'
        });

    } catch (error) {
        console.error('Error updating article:', error);
        return NextResponse.json(
            { message: 'Error updating article' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}

// DELETE article
export async function DELETE(request, { params }) {
    const connection = await pool.getConnection();
    try {
        const user = await verifyAuth();
        if (!user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = params;

        // Check if user has permission
        const [articles] = await connection.execute(
            'SELECT posted_by FROM articles WHERE aid = ?',
            [id]
        );

        if (articles.length === 0) {
            return NextResponse.json(
                { message: 'Article not found' },
                { status: 404 }
            );
        }

        if (articles[0].posted_by !== user.userId && user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Not authorized to delete this article' },
                { status: 403 }
            );
        }

        await connection.execute(
            'DELETE FROM articles WHERE aid = ?',
            [id]
        );

        return NextResponse.json({
            message: 'Article deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting article:', error);
        return NextResponse.json(
            { message: 'Error deleting article' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}