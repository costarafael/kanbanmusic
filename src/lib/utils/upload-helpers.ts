import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export interface UploadOptions {
  allowedTypes: string[];
  maxSize: number;
  directory: string;
  fieldName: string;
}

export async function handleFileUpload(
  request: NextRequest,
  options: UploadOptions
): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get(options.fieldName) as File;

    if (!file) {
      return NextResponse.json({ error: `No ${options.fieldName} file provided` }, { status: 400 });
    }

    // Validate file type
    if (!options.allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validate file size
    if (file.size > options.maxSize) {
      return NextResponse.json({ error: 'File size too large' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', options.directory);
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'bin';
    const filename = `${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    // Write file
    await writeFile(filepath, buffer);

    const url = `/uploads/${options.directory}/${filename}`;
    return NextResponse.json({ url });

  } catch (error) {
    console.error(`${options.fieldName} upload error:`, error);
    return NextResponse.json({ error: `Failed to upload ${options.fieldName}` }, { status: 500 });
  }
}

export const UPLOAD_CONFIGS = {
  audio: {
    allowedTypes: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac', 'audio/mpeg'] as string[],
    maxSize: 4.5 * 1024 * 1024, // 4.5MB (Vercel maximum function payload)
    directory: 'audio',
    fieldName: 'audio'
  },
  cover: {
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as string[],
    maxSize: 4.5 * 1024 * 1024, // 4.5MB (Vercel maximum function payload)
    directory: 'covers',
    fieldName: 'cover'
  }
};