import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';

interface ClapMusicResult {
  success: boolean;
  musicNotes?: string;
  analysis?: {
    genre: string;
    mood: string;
    energy: string;
    instruments: string[];
    style: string;
    confidence: number;
  };
  rawResults?: any;
  error?: string;
}

/**
 * Create fallback analysis based on filename
 */
function createFallbackAnalysis(filename: string): ClapMusicResult {
  const lowerName = filename.toLowerCase();
  
  // Try to detect genre from filename
  let genre = 'unknown';
  if (lowerName.includes('rock')) genre = 'rock';
  else if (lowerName.includes('pop')) genre = 'pop';
  else if (lowerName.includes('jazz')) genre = 'jazz';
  else if (lowerName.includes('classical')) genre = 'classical';
  else if (lowerName.includes('electronic') || lowerName.includes('edm')) genre = 'electronic';
  else if (lowerName.includes('hip') || lowerName.includes('hop') || lowerName.includes('rap')) genre = 'hip hop';
  else if (lowerName.includes('remix')) genre = 'electronic remix';
  
  // Try to detect mood from filename
  let mood = 'unknown';
  if (lowerName.includes('happy') || lowerName.includes('upbeat')) mood = 'happy';
  else if (lowerName.includes('sad') || lowerName.includes('melancholic')) mood = 'sad';
  else if (lowerName.includes('chill') || lowerName.includes('calm')) mood = 'calm';
  else if (lowerName.includes('party') || lowerName.includes('dance')) mood = 'energetic';
  else if (lowerName.includes('remix')) mood = 'energetic';
  
  // Basic analysis based on filename
  const analysis = {
    genre,
    mood,
    energy: mood === 'energetic' ? 'high' : mood === 'calm' ? 'low' : 'medium',
    instruments: [] as string[],
    style: lowerName.includes('remix') ? 'electronic remix' : 'original',
    confidence: 0.3 // Low confidence for filename-based analysis
  };
  
  const musicNotes = `🎵 **Music Analysis** (Filename-based)\n\n**Genre:** ${genre.charAt(0).toUpperCase() + genre.slice(1)}\n**Mood:** ${mood.charAt(0).toUpperCase() + mood.slice(1)}\n**Style:** ${analysis.style.charAt(0).toUpperCase() + analysis.style.slice(1)}\n**Confidence:** 30% (Limited analysis)\n\n*Note: AI model unavailable. Analysis based on filename patterns.*`;
  
  return {
    success: true,
    musicNotes,
    analysis
  };
}

/**
 * Convert audio to WAV mono 48kHz and trim to first 10 seconds using ffmpeg
 */
async function convertAudioToWavMono(audioBuffer: ArrayBuffer, originalFilename: string): Promise<ArrayBuffer> {
  const tempDir = tmpdir();
  const inputFile = path.join(tempDir, `input_${Date.now()}_${originalFilename}`);
  const outputFile = path.join(tempDir, `output_${Date.now()}_converted.wav`);
  
  try {
    // Write input file
    await fs.writeFile(inputFile, Buffer.from(audioBuffer));
    console.log('🔄 Converting audio to WAV mono 48kHz and trimming to 10 seconds...');
    
    // Convert using ffmpeg: trim to 10 seconds, force mono channel, 48kHz sample rate, 16-bit WAV
    const ffmpegResult = await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn('/opt/homebrew/bin/ffmpeg', [
        '-i', inputFile,           // Input file
        '-t', '10',               // Trim to first 10 seconds
        '-ac', '1',               // Mono (1 audio channel)
        '-ar', '48000',           // 48kHz sample rate
        '-sample_fmt', 's16',     // 16-bit signed integer samples
        '-f', 'wav',              // WAV format
        '-y',                     // Overwrite output file
        outputFile                // Output file
      ]);
      
      let stderr = '';
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Audio conversion successful');
          resolve();
        } else {
          console.error('❌ FFmpeg conversion failed:', stderr);
          reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
        }
      });
      
      ffmpeg.on('error', (err) => {
        console.error('❌ FFmpeg spawn error:', err);
        reject(err);
      });
    });
    
    // Read converted file
    const convertedBuffer = await fs.readFile(outputFile);
    console.log(`✅ Audio converted: ${audioBuffer.byteLength} bytes → ${convertedBuffer.length} bytes (WAV mono 48kHz)`);
    
    return convertedBuffer.buffer as ArrayBuffer;
    
  } finally {
    // Cleanup temporary files
    try {
      await fs.unlink(inputFile).catch(() => {});
      await fs.unlink(outputFile).catch(() => {});
    } catch (cleanupError) {
      console.warn('Warning: Failed to cleanup temp files:', cleanupError);
    }
  }
}

/**
 * Call Hugging Face CLAP model for music analysis
 */
async function callClapModel(audioBuffer: ArrayBuffer, filename: string): Promise<ClapMusicResult> {
  try {
    console.log('🎵 Calling CLAP model for music analysis...');
    
    if (!process.env.HUGGINGFACE_API_TOKEN) {
      throw new Error('HUGGINGFACE_API_TOKEN not configured');
    }

    // Convert audio to WAV mono 48kHz format and trim to 10 seconds
    const convertedAudioBuffer = await convertAudioToWavMono(audioBuffer, filename);
    console.log('🎵 Audio converted (10s), sending to LP-MusicCaps model...');
    
    // Define musical categories for zero-shot classification
    const musicLabels = [
      // Genres
      "rock music", "pop music", "jazz music", "classical music", 
      "electronic music", "hip hop music", "folk music", "country music",
      "blues music", "reggae music", "metal music", "punk music",
      
      // Moods & Energy
      "happy upbeat music", "sad melancholic music", "energetic exciting music",
      "calm relaxing music", "aggressive intense music", "romantic love song",
      "party dance music", "peaceful ambient music", "dramatic epic music",
      
      // Instruments
      "guitar music", "piano music", "violin music", "drums music",
      "synthesizer electronic", "saxophone jazz", "acoustic guitar",
      "electric guitar", "orchestral music", "vocal singing",
      
      // Styles
      "instrumental music", "vocal music", "slow ballad", "fast tempo",
      "acoustic unplugged", "heavy distorted", "melodic harmonic"
    ];

    // Send audio directly to LP-MusicCaps model (automatic music captioning)
    // LP-MusicCaps doesn't need candidate labels - it generates descriptions automatically
    const response = await fetch(
      'https://api-inference.huggingface.co/models/seungheondoh/lp-music-caps',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
          'Content-Type': 'audio/wav',
        },
        body: convertedAudioBuffer, // Send 10-second WAV directly
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ CLAP API error:', response.status, response.statusText, errorText);
      
      if (response.status === 503) {
        throw new Error('CLAP model is loading, please try again in a few minutes');
      }
      if (response.status === 401) {
        throw new Error('Invalid Hugging Face API token');
      }
      if (response.status === 404) {
        throw new Error('Audio analysis model not available via Inference API');
      }
      
      throw new Error(`CLAP API request failed: ${response.status} ${response.statusText}`);
    }

    const results = await response.json();
    console.log('✅ LP-MusicCaps response received:', results);

    // LP-MusicCaps returns a direct text description
    let musicDescription = '';
    if (Array.isArray(results) && results.length > 0) {
      musicDescription = results[0]?.generated_text || results[0]?.text || JSON.stringify(results[0]);
    } else if (typeof results === 'string') {
      musicDescription = results;
    } else if (results?.generated_text) {
      musicDescription = results.generated_text;
    } else {
      musicDescription = JSON.stringify(results);
    }

    // Format the LP-MusicCaps description into music notes
    const musicNotes = formatLPMusicCapsNotes(musicDescription);

    return {
      success: true,
      musicNotes,
      analysis: undefined, // LP-MusicCaps doesn't provide structured analysis
      rawResults: results
    };

  } catch (error: any) {
    console.error('❌ CLAP music analysis failed:', error);
    
    return {
      success: false,
      error: error.message || 'CLAP analysis failed'
    };
  }
}

/**
 * Process CLAP classification results into structured analysis
 */
function processClapResults(results: any) {
  if (!results || !Array.isArray(results)) {
    return undefined;
  }

  // Sort results by confidence score
  const sortedResults = results.sort((a: any, b: any) => b.score - a.score);
  
  const analysis = {
    genre: 'unknown',
    mood: 'unknown', 
    energy: 'unknown',
    instruments: [] as string[],
    style: 'unknown',
    confidence: 0
  };

  // Extract genres
  const genres = ['rock', 'pop', 'jazz', 'classical', 'electronic', 'hip hop', 'folk', 'country', 'blues', 'reggae', 'metal', 'punk'];
  for (const result of sortedResults) {
    const label = result.label.toLowerCase();
    const genre = genres.find(g => label.includes(g));
    if (genre && result.score > 0.1) {
      analysis.genre = genre;
      analysis.confidence = Math.max(analysis.confidence, result.score);
      break;
    }
  }

  // Extract mood
  const moods = [
    { keywords: ['happy', 'upbeat'], mood: 'happy' },
    { keywords: ['sad', 'melancholic'], mood: 'sad' },
    { keywords: ['energetic', 'exciting', 'party', 'dance'], mood: 'energetic' },
    { keywords: ['calm', 'relaxing', 'peaceful'], mood: 'calm' },
    { keywords: ['aggressive', 'intense'], mood: 'intense' },
    { keywords: ['romantic', 'love'], mood: 'romantic' },
    { keywords: ['dramatic', 'epic'], mood: 'dramatic' }
  ];
  
  for (const result of sortedResults) {
    const label = result.label.toLowerCase();
    const moodMatch = moods.find(m => m.keywords.some(k => label.includes(k)));
    if (moodMatch && result.score > 0.1) {
      analysis.mood = moodMatch.mood;
      break;
    }
  }

  // Extract instruments
  const instruments = ['guitar', 'piano', 'violin', 'drums', 'synthesizer', 'saxophone'];
  for (const result of sortedResults) {
    const label = result.label.toLowerCase();
    const instrument = instruments.find(i => label.includes(i));
    if (instrument && result.score > 0.1 && !analysis.instruments.includes(instrument)) {
      analysis.instruments.push(instrument);
    }
  }

  // Extract style
  const styles = [
    { keywords: ['instrumental'], style: 'instrumental' },
    { keywords: ['vocal', 'singing'], style: 'vocal' },
    { keywords: ['acoustic', 'unplugged'], style: 'acoustic' },
    { keywords: ['electronic', 'synthesizer'], style: 'electronic' },
    { keywords: ['slow', 'ballad'], style: 'slow' },
    { keywords: ['fast', 'tempo'], style: 'fast' }
  ];
  
  for (const result of sortedResults) {
    const label = result.label.toLowerCase();
    const styleMatch = styles.find(s => s.keywords.some(k => label.includes(k)));
    if (styleMatch && result.score > 0.1) {
      analysis.style = styleMatch.style;
      break;
    }
  }

  return analysis;
}

/**
 * Format LP-MusicCaps description into readable music notes
 */
function formatLPMusicCapsNotes(description: string): string {
  if (!description || description.trim() === '') {
    return '🎵 **Music AI Analysis**\n\nUnable to analyze this audio file. The LP-MusicCaps model could not generate a description.';
  }

  // Clean up the description
  const cleanDescription = description.trim();
  
  let notes = '🎵 **Music AI Analysis**\n\n';
  notes += `**Description:** ${cleanDescription}\n\n`;
  notes += '*Generated by LP-MusicCaps (Music Captioning)*\n';
  notes += '*Analysis based on first 10 seconds of audio*';
  
  return notes;
}

/**
 * Format analysis into readable music notes (legacy CLAP function)
 */
function formatMusicNotes(analysis: any): string {
  if (!analysis) {
    return '🎵 **Music AI Analysis**\n\nUnable to analyze this audio file. The CLAP model could not extract musical features.';
  }

  const { genre, mood, instruments, style, confidence } = analysis;
  
  let notes = '🎵 **Music AI Analysis**\n\n';
  
  if (genre && genre !== 'unknown') {
    notes += `**Genre:** ${genre.charAt(0).toUpperCase() + genre.slice(1)}\n`;
  }
  
  if (mood && mood !== 'unknown') {
    notes += `**Mood:** ${mood.charAt(0).toUpperCase() + mood.slice(1)}\n`;
  }
  
  if (style && style !== 'unknown') {
    notes += `**Style:** ${style.charAt(0).toUpperCase() + style.slice(1)}\n`;
  }
  
  if (instruments && instruments.length > 0) {
    notes += `**Instruments:** ${instruments.map((i: string) => i.charAt(0).toUpperCase() + i.slice(1)).join(', ')}\n`;
  }
  
  if (confidence > 0) {
    notes += `**Confidence:** ${Math.round(confidence * 100)}%\n`;
  }
  
  notes += '\n*Generated by CLAP (Contrastive Language-Audio Pretraining)*';
  
  return notes;
}

export async function POST(request: NextRequest) {
  console.log('🎵 LP-MusicCaps music analysis API called');
  
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      console.error('❌ No audio file provided');
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    console.log('📁 Processing audio file:', audioFile.name, `(${audioFile.size} bytes, ${audioFile.type})`);

    // Validate file type (accept both correct MIME types and generic octet-stream for audio files)
    const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac', 'audio/mpeg'];
    const isAudioFile = allowedTypes.includes(audioFile.type) || 
      (audioFile.type === 'application/octet-stream' && 
       /\.(mp3|wav|ogg|m4a|aac)$/i.test(audioFile.name));
    
    if (!isAudioFile) {
      console.error('❌ Invalid file type:', audioFile.type, 'for file:', audioFile.name);
      return NextResponse.json({ error: `Invalid file type: ${audioFile.type} for ${audioFile.name}` }, { status: 400 });
    }

    // Validate file size (limit to 10MB for CLAP API)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (audioFile.size > maxSize) {
      console.error('❌ File too large for CLAP analysis:', audioFile.size);
      return NextResponse.json({ 
        error: 'File too large for AI analysis (max 10MB)' 
      }, { status: 400 });
    }

    // Convert audio to buffer
    const audioBuffer = await audioFile.arrayBuffer();
    
    // Call CLAP model
    const result = await callClapModel(audioBuffer, audioFile.name);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'CLAP analysis failed'
      });
    }

    console.log('✅ LP-MusicCaps music analysis completed successfully');
    
    return NextResponse.json({
      success: true,
      musicNotes: result.musicNotes,
      analysis: result.analysis,
      model: 'LP-MusicCaps (seungheondoh/lp-music-caps)',
      provider: 'Hugging Face',
      audioLength: '10 seconds'
    });

  } catch (error: any) {
    console.error('❌ CLAP music analysis error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'CLAP music analysis failed',
      details: error.stack
    }, { status: 500 });
  }
}

/**
 * GET endpoint for API information
 */
export async function GET() {
  return NextResponse.json({
    model: 'LP-MusicCaps (seungheondoh/lp-music-caps)',
    provider: 'Hugging Face',
    description: 'Large-scale Language-audio Pre-training for Music Captioning',
    maxFileSize: '10MB',
    supportedFormats: ['MP3', 'WAV', 'OGG', 'M4A', 'AAC'],
    capabilities: [
      'Automatic music captioning',
      'Music description generation',
      'Audio content analysis',
      'Musical feature extraction'
    ],
    audioLength: '10 seconds (trimmed)',
    endpoint: '/api/ai/clap-music'
  });
}