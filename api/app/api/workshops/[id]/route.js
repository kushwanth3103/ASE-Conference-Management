import { NextResponse } from 'next/server';
import pool from '../../lib/db';
import { verifyAuth } from '../../lib/auth';

// GET single workshop
export async function GET(request, { params }) {
    const connection = await pool.getConnection();
    try {
        const { id } = params;

        const [workshops] = await connection.execute(
            `SELECT w.*, u.name as creator_name 
       FROM workshops w 
       LEFT JOIN users u ON w.created_by = u.uid 
       WHERE w.wid = ?`,
            [id]
        );

        if (workshops.length === 0) {
            return NextResponse.json(
                { message: 'Workshop not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(workshops[0]);

    } catch (error) {
        console.error('Error fetching workshop:', error);
        return NextResponse.json(
            { message: 'Error fetching workshop' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}

// PUT update workshop
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
        const { title, date, description, link } = await request.json();

        // Validate input
        if (!title || !date || !description || !link) {
            return NextResponse.json(
                { message: 'All fields are required' },
                { status: 400 }
            );
        }

        // Check if user has permission
        const [workshops] = await connection.execute(
            'SELECT created_by FROM workshops WHERE wid = ?',
            [id]
        );

        if (workshops.length === 0) {
            return NextResponse.json(
                { message: 'Workshop not found' },
                { status: 404 }
            );
        }

        if (workshops[0].created_by !== user.userId && user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Not authorized to update this workshop' },
                { status: 403 }
            );
        }

        // Update workshop
        await connection.execute(
            `UPDATE workshops 
       SET title = ?, workshop_date = ?, description = ?, link = ? 
       WHERE wid = ?`,
            [title, date, description, link, id]
        );

        return NextResponse.json({
            message: 'Workshop updated successfully'
        });

    } catch (error) {
        console.error('Error updating workshop:', error);
        return NextResponse.json(
            { message: 'Error updating workshop' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}

// DELETE workshop
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
        const [workshops] = await connection.execute(
            'SELECT created_by FROM workshops WHERE wid = ?',
            [id]
        );

        if (workshops.length === 0) {
            return NextResponse.json(
                { message: 'Workshop not found' },
                { status: 404 }
            );
        }

        if (workshops[0].created_by !== user.userId && user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Not authorized to delete this workshop' },
                { status: 403 }
            );
        }

        await connection.execute(
            'DELETE FROM workshops WHERE wid = ?',
            [id]
        );

        return NextResponse.json({
            message: 'Workshop deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting workshop:', error);
        return NextResponse.json(
            { message: 'Error deleting workshop' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
