import { NextRequest, NextResponse } from 'next/server';

async function callLPMusicCapsAPI(audioFile: File): Promise<string | null> {
  try {
    console.log('🎵 Calling LP-MusicCaps for audio analysis...');
    
    const formData = new FormData();
    formData.append('audio', audioFile);

    // Get the base URL for the current request
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3001' 
        : 'https://kanbanmusic-fqmlybkuk-costarafaels-projects.vercel.app';
    
    const response = await fetch(`${baseUrl}/api/ai/lp-music-caps`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error('LP-MusicCaps API error:', response.status, response.statusText);
      return null;
    }

    const result = await response.json();
    
    if (result.success && result.analysis?.music_caption?.text) {
      // Extract a summary from the full analysis
      const fullCaption = result.analysis.music_caption.text;
      const insights = result.analysis.extracted_insights;
      
      const summary = `🎵 Music Analysis:\n\n` +
        `Genre: ${insights?.genre || 'Unknown'}\n` +
        `Mood: ${insights?.mood || 'Unknown'}\n` +
        `Tempo: ${insights?.tempo || 'Unknown'}\n` +
        `Instruments: ${insights?.instruments?.join(', ') || 'Unknown'}\n\n` +
        `AI Description:\n${fullCaption.substring(0, 500)}${fullCaption.length > 500 ? '...' : ''}`;
      
      console.log('✅ LP-MusicCaps analysis completed');
      return summary;
    }
    
    return null;
  } catch (error) {
    console.error('Error calling LP-MusicCaps:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio') as File;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac', 'audio/mpeg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validate file size (100MB)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size too large' }, { status: 400 });
    }

    console.log('🔄 Uploading audio file to Vercel Blob...');
    
    // Use Vercel Blob client upload for large files
    const { upload } = await import('@vercel/blob/client');
    
    const blob = await upload(file.name, file, {
      access: 'public',
      handleUploadUrl: '/api/upload/audio-presigned',
    });
    
    console.log('✅ Blob upload successful:', blob.url);
    const uploadedUrl = blob.url;
    
    // Call LP-MusicCaps API for music analysis
    console.log('🔄 Processing music analysis for uploaded file...');
    const musicAnalysis = await callLPMusicCapsAPI(file);

    const response = {
      url: uploadedUrl,
      music_ai_notes: musicAnalysis || undefined
    };

    console.log('📁 Audio upload completed:', { url: uploadedUrl, hasAnalysis: !!musicAnalysis });
    return NextResponse.json(response);

  } catch (error) {
    console.error('Audio upload error:', error);
    return NextResponse.json({ error: 'Failed to upload audio file' }, { status: 500 });
  }
}