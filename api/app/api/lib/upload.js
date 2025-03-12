import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export const UPLOAD_DIR = join(process.cwd(), 'public/uploads/papers');

// Ensure upload directory exists
try {
    await mkdir(UPLOAD_DIR, { recursive: true });
} catch (error) {
    console.error('Error creating upload directory:', error);
}

// Parse multipart form data
export async function parseFormData(request) {
    const formData = await request.formData();
    const file = formData.get('paperFile');

    if (!file || typeof file.arrayBuffer !== 'function') {
        throw new Error('Invalid file upload');
    }

    // Validate file type
    if (!file.type || file.type !== 'application/pdf') {
        throw new Error('Only PDF files are allowed');
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size exceeds 10MB limit');
    }

    // Get other form data
    const data = {};
    for (const [key, value] of formData.entries()) {
        if (key !== 'paperFile') {
            data[key] = value;
        }
    }

    return { file, data };
}