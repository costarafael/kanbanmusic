import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

interface UploadOptions {
  allowedTypes: string[];
  maxSize: number;
  directory: string;
  fieldName: string;
}

const AUDIO_CONFIG: UploadOptions = {
  allowedTypes: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac', 'audio/mpeg'],
  maxSize: 100 * 1024 * 1024, // 100MB
  directory: 'audio',
  fieldName: 'audio'
};

async function callLPMusicCapsAPI(filePath: string): Promise<string | null> {
  try {
    console.log('🎵 Calling LP-MusicCaps for audio analysis...');
    
    const formData = new FormData();
    const fileBuffer = await readFile(filePath);
    const blob = new Blob([new Uint8Array(fileBuffer)], { type: 'audio/wav' });
    formData.append('audio', blob, 'audio.wav');

    const response = await fetch('http://localhost:3001/api/ai/lp-music-caps', {
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
    const file = formData.get(AUDIO_CONFIG.fieldName) as File;

    if (!file) {
      return NextResponse.json({ error: `No ${AUDIO_CONFIG.fieldName} file provided` }, { status: 400 });
    }

    // Validate file type
    if (!AUDIO_CONFIG.allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validate file size
    if (file.size > AUDIO_CONFIG.maxSize) {
      return NextResponse.json({ error: 'File size too large' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', AUDIO_CONFIG.directory);
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

    const url = `/uploads/${AUDIO_CONFIG.directory}/${filename}`;
    
    // Call LP-MusicCaps API for music analysis
    console.log('🔄 Processing music analysis for uploaded file...');
    const musicAnalysis = await callLPMusicCapsAPI(filepath);

    const response = {
      url,
      music_ai_notes: musicAnalysis || undefined
    };

    console.log('📁 Audio upload completed:', { url, hasAnalysis: !!musicAnalysis });
    return NextResponse.json(response);

  } catch (error) {
    console.error(`${AUDIO_CONFIG.fieldName} upload error:`, error);
    return NextResponse.json({ error: `Failed to upload ${AUDIO_CONFIG.fieldName}` }, { status: 500 });
  }
}