import { NextRequest, NextResponse } from 'next/server';

async function callHuggingFaceMusicAPI(audioFile: File): Promise<string | null> {
  try {
    console.log('🎵 Calling Hugging Face Music API for analysis...');
    
    const formData = new FormData();
    formData.append('audio', audioFile);

    // Get the base URL for the current request
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3001' 
        : 'https://kanbanmusic.vercel.app';
    
    const response = await fetch(`${baseUrl}/api/ai/huggingface-music`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error('Hugging Face Music API error:', response.status, response.statusText);
      return null;
    }

    const result = await response.json();
    
    if (result.success && result.musicNotes) {
      console.log('✅ Hugging Face music analysis completed');
      return result.musicNotes;
    }
    
    if (result.error) {
      console.error('Hugging Face API returned error:', result.error);
    }
    
    return null;
  } catch (error) {
    console.error('Error calling Hugging Face Music API:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  console.log('🎵 Audio upload API called');
  
  try {
    const formData = await request.formData();
    const file = formData.get('audio') as File;

    console.log('📁 Form data parsed, file:', file ? `${file.name} (${file.size} bytes, ${file.type})` : 'No file');

    if (!file) {
      console.error('❌ No audio file provided');
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac', 'audio/mpeg'];
    if (!allowedTypes.includes(file.type)) {
      console.error('❌ Invalid file type:', file.type);
      return NextResponse.json({ error: `Invalid file type: ${file.type}` }, { status: 400 });
    }

    // Validate file size (100MB)
    if (file.size > 100 * 1024 * 1024) {
      console.error('❌ File too large:', file.size);
      return NextResponse.json({ error: 'File size too large' }, { status: 400 });
    }

    console.log('✅ Validation passed, starting upload to Vercel Blob...');
    
    // Use server-side put for direct blob upload (avoids filesystem operations)
    const { put } = await import('@vercel/blob');
    
    const blob = await put(file.name, file, {
      access: 'public',
      addRandomSuffix: true,
    });
    
    console.log('✅ Blob upload successful:', blob.url);
    const uploadedUrl = blob.url;
    
    // Call Hugging Face Music API for music analysis
    console.log('🔄 Processing music analysis for uploaded file...');
    const musicAnalysis = await callHuggingFaceMusicAPI(file);

    const response = {
      url: uploadedUrl,
      music_ai_notes: musicAnalysis || undefined
    };

    console.log('📁 Audio upload completed:', { url: uploadedUrl, hasAnalysis: !!musicAnalysis });
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ Audio upload error:', error);
    console.error('❌ Error stack:', error.stack);
    
    const errorMessage = error?.message || 'Unknown error occurred';
    return NextResponse.json({ 
      error: 'Failed to upload audio file',
      details: errorMessage 
    }, { status: 500 });
  }
}