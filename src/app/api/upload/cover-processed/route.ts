import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { processImage, getProcessedImageExtension } from '@/lib/utils/image-processing';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('cover') as File;

    if (!file) {
      return NextResponse.json({ error: 'No cover file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' }, { status: 400 });
    }

    // Validate file size (original - before processing)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size too large. Maximum size is 10MB.' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process image: convert to JPEG and resize if needed
    const processedBuffer = await processImage(buffer, {
      maxWidth: 600,
      quality: 85,
      format: 'jpeg'
    });

    // Generate filename with proper extension
    const fileId = nanoid();
    const extension = getProcessedImageExtension('jpeg');
    const filename = `cover-${fileId}.${extension}`;

    // Upload processed image to Vercel Blob
    const blob = await put(filename, processedBuffer, {
      access: 'public',
      addRandomSuffix: true,
    });

    return NextResponse.json({ 
      url: blob.url,
      size: processedBuffer.length,
      originalSize: file.size,
      processed: true
    });

  } catch (error) {
    console.error('Cover upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload and process cover image' 
    }, { status: 500 });
  }
}