import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, readFile } from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

// LP-MusicCaps Gradio Space configuration
const LP_MUSIC_CAPS_SPACE_URL = 'https://seungheondoh-lp-music-caps-demo.hf.space';

interface MusicCapsResult {
  caption: string;
  confidence?: number;
  model_used: string;
  processing_time_ms: number;
  metadata?: {
    sample_rate: number;
    duration: number;
    channels: number;
  };
  error?: string;
}

/**
 * Convert audio file for LP-MusicCaps (typically works better with WAV)
 */
async function convertAudioForMusicCaps(inputPath: string): Promise<string> {
  const tempDir = os.tmpdir();
  const outputPath = path.join(tempDir, `musiccaps_${Date.now()}.wav`);
  
  // Convert to WAV format which typically works best with the model
  const ffmpegCommand = `ffmpeg -i "${inputPath}" -ar 22050 -ac 2 -f wav "${outputPath}"`;
  
  try {
    await execAsync(ffmpegCommand);
    return outputPath;
  } catch (error) {
    throw new Error(`Audio conversion failed: ${error}`);
  }
}

/**
 * Get audio metadata
 */
async function getAudioMetadata(filePath: string) {
  const command = `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`;
  
  try {
    const { stdout } = await execAsync(command);
    const metadata = JSON.parse(stdout);
    const audioStream = metadata.streams.find((stream: any) => stream.codec_type === 'audio');
    
    return {
      duration: parseFloat(metadata.format.duration),
      sample_rate: parseInt(audioStream?.sample_rate || '0'),
      channels: parseInt(audioStream?.channels || '0'),
      bitrate: parseInt(metadata.format.bit_rate || '0'),
      codec: audioStream?.codec_name,
      format_name: metadata.format.format_name,
      size: parseInt(metadata.format.size || '0')
    };
  } catch (error) {
    throw new Error(`Failed to get audio metadata: ${error}`);
  }
}

/**
 * Call LP-MusicCaps via Gradio API
 */
async function callLPMusicCapsAPI(audioBuffer: Buffer): Promise<MusicCapsResult> {
  const startTime = Date.now();
  
  try {
    // Convert buffer to base64 for Gradio API
    const base64Audio = audioBuffer.toString('base64');
    const audioData = `data:audio/wav;base64,${base64Audio}`;
    
    console.log('🎵 Calling LP-MusicCaps API...');
    
    // Call the Gradio predict API
    const response = await fetch(`${LP_MUSIC_CAPS_SPACE_URL}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [{
          name: "audio.wav",
          data: audioData,
          is_file: false
        }]
      }),
    });

    const processingTime = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`LP-MusicCaps API Error (${response.status}): ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ LP-MusicCaps response:', result);

    // Extract the caption from the response
    let caption = '';
    if (result.data && result.data.length > 0) {
      caption = result.data[0] || 'No caption generated';
    } else {
      caption = 'Unable to generate caption';
    }

    return {
      caption,
      model_used: 'LP-MusicCaps (seungheondoh/lp-music-caps)',
      processing_time_ms: processingTime,
      confidence: 0.8 // Placeholder since the model doesn't return confidence
    };

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('❌ LP-MusicCaps API failed:', error);
    
    return {
      caption: '',
      model_used: 'LP-MusicCaps (failed)',
      processing_time_ms: processingTime,
      error: error.message
    };
  }
}

/**
 * Alternative method: Try direct file upload to Gradio
 */
async function callLPMusicCapsWithFile(filePath: string): Promise<MusicCapsResult> {
  const startTime = Date.now();
  
  try {
    console.log('🎵 Trying file upload to LP-MusicCaps...');
    
    // Read file as buffer
    const fileBuffer = await readFile(filePath);
    const base64Audio = fileBuffer.toString('base64');
    
    // Try different data format
    const response = await fetch(`${LP_MUSIC_CAPS_SPACE_URL}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [base64Audio]
      }),
    });

    const processingTime = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`File upload failed (${response.status}): ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ File upload response:', result);

    let caption = '';
    if (result.data && result.data.length > 0) {
      caption = result.data[0] || 'No caption generated';
    }

    return {
      caption,
      model_used: 'LP-MusicCaps (file upload)',
      processing_time_ms: processingTime,
      confidence: 0.8
    };

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    return {
      caption: '',
      model_used: 'LP-MusicCaps (file upload failed)',
      processing_time_ms: processingTime,
      error: error.message
    };
  }
}

export async function POST(request: NextRequest) {
  const tempFiles: string[] = [];
  
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    console.log(`🎵 Starting LP-MusicCaps analysis for: ${audioFile.name}`);
    
    // Save uploaded file temporarily
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const tempDir = os.tmpdir();
    const inputPath = path.join(tempDir, `input_${Date.now()}_${audioFile.name}`);
    await writeFile(inputPath, buffer);
    tempFiles.push(inputPath);

    // Get original metadata
    const originalMetadata = await getAudioMetadata(inputPath);
    console.log(`📊 Audio: ${originalMetadata.duration}s, ${originalMetadata.sample_rate}Hz, ${originalMetadata.channels}ch`);
    
    // Convert audio for LP-MusicCaps
    const convertedPath = await convertAudioForMusicCaps(inputPath);
    tempFiles.push(convertedPath);
    
    const convertedMetadata = await getAudioMetadata(convertedPath);
    const convertedBuffer = await readFile(convertedPath);
    
    // Try multiple approaches to call LP-MusicCaps
    let musicCapsResult: MusicCapsResult;
    
    console.log('🔄 Attempting LP-MusicCaps API call (method 1)...');
    musicCapsResult = await callLPMusicCapsAPI(convertedBuffer);
    
    // If first method fails, try alternative
    if (musicCapsResult.error) {
      console.log('🔄 Attempting LP-MusicCaps with file upload (method 2)...');
      const alternativeResult = await callLPMusicCapsWithFile(convertedPath);
      if (!alternativeResult.error) {
        musicCapsResult = alternativeResult;
      }
    }
    
    // Cleanup temp files
    for (const tempFile of tempFiles) {
      try {
        await unlink(tempFile);
      } catch {
        console.warn(`Failed to cleanup temp file: ${tempFile}`);
      }
    }
    
    // Generate insights from the caption
    const insights = generateMusicInsights(musicCapsResult.caption, originalMetadata);
    
    return NextResponse.json({
      success: !musicCapsResult.error,
      analysis: {
        music_caption: {
          text: musicCapsResult.caption,
          model: musicCapsResult.model_used,
          processing_time_ms: musicCapsResult.processing_time_ms,
          confidence: musicCapsResult.confidence,
          success: !musicCapsResult.error
        },
        extracted_insights: insights,
        technical_analysis: {
          audio_quality: originalMetadata.bitrate > 256000 ? 'high' : originalMetadata.bitrate > 128000 ? 'good' : 'standard',
          duration_category: originalMetadata.duration > 300 ? 'long' : originalMetadata.duration > 120 ? 'medium' : 'short',
          stereo_quality: originalMetadata.channels > 1 ? 'stereo' : 'mono'
        }
      },
      metadata: {
        original: originalMetadata,
        converted: convertedMetadata,
        model_info: {
          name: 'LP-MusicCaps',
          description: 'LLM-Based Pseudo Music Captioning',
          paper: 'https://arxiv.org/abs/2307.16372',
          authors: 'SeungHeon Doh, Keunwoo Choi, Jongpil Lee, Juhan Nam',
          venue: 'ISMIR 2023'
        }
      },
      error: musicCapsResult.error || null
    });

  } catch (error: any) {
    // Cleanup on error
    for (const tempFile of tempFiles) {
      try {
        await unlink(tempFile);
      } catch {
        console.warn(`Failed to cleanup temp file on error: ${tempFile}`);
      }
    }
    
    console.error('LP-MusicCaps analysis error:', error);
    return NextResponse.json(
      { error: `Music analysis failed: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Generate insights from the music caption
 */
function generateMusicInsights(caption: string, _metadata: any) {
  // Future: Could use metadata for enhanced insights
  if (!caption || caption.includes('No caption') || caption.includes('Unable to generate')) {
    return {
      genre: 'unknown',
      mood: 'unknown',
      instruments: [],
      tempo: 'unknown',
      style: 'unknown',
      confidence: 'low',
      summary: 'Unable to extract musical insights from caption'
    };
  }

  const lowerCaption = caption.toLowerCase();
  
  // Extract genre hints
  const genreKeywords = {
    'rock': ['rock', 'guitar', 'drums', 'electric'],
    'classical': ['orchestra', 'symphony', 'classical', 'piano', 'violin'],
    'electronic': ['electronic', 'synthesizer', 'techno', 'edm'],
    'folk': ['folk', 'acoustic', 'traditional'],
    'jazz': ['jazz', 'saxophone', 'trumpet', 'improvisation'],
    'pop': ['pop', 'catchy', 'commercial'],
    'ambient': ['ambient', 'atmospheric', 'ambient']
  };
  
  let detectedGenre = 'unknown';
  for (const [genre, keywords] of Object.entries(genreKeywords)) {
    if (keywords.some(keyword => lowerCaption.includes(keyword))) {
      detectedGenre = genre;
      break;
    }
  }
  
  // Extract mood
  const moodKeywords = {
    'energetic': ['energetic', 'upbeat', 'lively', 'exciting'],
    'calm': ['calm', 'peaceful', 'relaxing', 'soothing'],
    'melancholic': ['sad', 'melancholic', 'somber', 'depressing'],
    'happy': ['happy', 'joyful', 'cheerful', 'uplifting'],
    'dramatic': ['dramatic', 'intense', 'powerful', 'epic']
  };
  
  let detectedMood = 'neutral';
  for (const [mood, keywords] of Object.entries(moodKeywords)) {
    if (keywords.some(keyword => lowerCaption.includes(keyword))) {
      detectedMood = mood;
      break;
    }
  }
  
  // Extract instruments
  const instrumentKeywords = ['guitar', 'piano', 'drums', 'violin', 'saxophone', 'trumpet', 'bass', 'synthesizer', 'flute', 'clarinet'];
  const detectedInstruments = instrumentKeywords.filter(instrument => lowerCaption.includes(instrument));
  
  // Extract tempo
  const tempoKeywords = {
    'fast': ['fast', 'quick', 'rapid', 'energetic'],
    'slow': ['slow', 'gentle', 'relaxed'],
    'moderate': ['moderate', 'medium']
  };
  
  let detectedTempo = 'unknown';
  for (const [tempo, keywords] of Object.entries(tempoKeywords)) {
    if (keywords.some(keyword => lowerCaption.includes(keyword))) {
      detectedTempo = tempo;
      break;
    }
  }
  
  return {
    genre: detectedGenre,
    mood: detectedMood,
    instruments: detectedInstruments,
    tempo: detectedTempo,
    style: detectedGenre !== 'unknown' ? detectedGenre : 'mixed',
    confidence: detectedGenre !== 'unknown' || detectedMood !== 'neutral' ? 'medium' : 'low',
    summary: `${detectedGenre} music with ${detectedMood} mood${detectedInstruments.length > 0 ? ` featuring ${detectedInstruments.join(', ')}` : ''}`
  };
}

/**
 * GET endpoint for API information
 */
export async function GET() {
  return NextResponse.json({
    description: 'LP-MusicCaps Music Analysis API',
    model: {
      name: 'LP-MusicCaps',
      description: 'LLM-Based Pseudo Music Captioning',
      paper: 'https://arxiv.org/abs/2307.16372',
      authors: 'SeungHeon Doh, Keunwoo Choi, Jongpil Lee, Juhan Nam',
      venue: 'ISMIR 2023',
      approach: 'Uses Large Language Models to generate contextually relevant captions for music'
    },
    capabilities: [
      'Generate descriptive captions for music',
      'Identify musical characteristics and style',
      'Extract genre, mood, and instrument information',
      'Provide natural language descriptions of musical content',
      'Support various audio formats (converted to WAV for processing)'
    ],
    space_info: {
      url: LP_MUSIC_CAPS_SPACE_URL,
      demo_available: true,
      api_access: 'Via Gradio interface',
      processing: 'Captions generated for 10-second segments'
    },
    usage: {
      endpoint: '/api/ai/lp-music-caps',
      method: 'POST',
      content_type: 'multipart/form-data',
      form_field: 'audio',
      supported_formats: 'MP3, WAV, M4A, OGG (converted to WAV internally)',
      response_format: 'Natural language caption describing the music'
    },
    note: 'This model generates human-readable descriptions of music content, including style, mood, instruments, and musical characteristics.'
  });
}