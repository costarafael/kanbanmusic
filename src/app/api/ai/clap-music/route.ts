import { NextRequest, NextResponse } from 'next/server';

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
 * Call Hugging Face CLAP model for music analysis
 */
async function callClapModel(audioBuffer: ArrayBuffer): Promise<ClapMusicResult> {
  try {
    console.log('🎵 Calling CLAP model for music analysis...');
    
    if (!process.env.HUGGINGFACE_API_TOKEN) {
      throw new Error('HUGGINGFACE_API_TOKEN not configured');
    }

    // Convert audio buffer to base64 for API
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    
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

    const response = await fetch(
      'https://api-inference.huggingface.co/models/laion/larger_clap_music_and_speech',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {
            audio: base64Audio
          },
          parameters: {
            candidate_labels: musicLabels,
            multi_label: true
          }
        }),
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
      
      throw new Error(`CLAP API request failed: ${response.status} ${response.statusText}`);
    }

    const results = await response.json();
    console.log('✅ CLAP API response received');

    // Process results and extract musical insights
    const analysis = processClapResults(results);
    
    // Generate music notes from analysis
    const musicNotes = formatMusicNotes(analysis);

    return {
      success: true,
      musicNotes,
      analysis,
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
 * Format analysis into readable music notes
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
  console.log('🎵 CLAP music analysis API called');
  
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      console.error('❌ No audio file provided');
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    console.log('📁 Processing audio file:', audioFile.name, `(${audioFile.size} bytes, ${audioFile.type})`);

    // Validate file type
    const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac', 'audio/mpeg'];
    if (!allowedTypes.includes(audioFile.type)) {
      console.error('❌ Invalid file type:', audioFile.type);
      return NextResponse.json({ error: `Invalid file type: ${audioFile.type}` }, { status: 400 });
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
    const result = await callClapModel(audioBuffer);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'CLAP analysis failed'
      });
    }

    console.log('✅ CLAP music analysis completed successfully');
    
    return NextResponse.json({
      success: true,
      musicNotes: result.musicNotes,
      analysis: result.analysis,
      model: 'CLAP (laion/larger_clap_music_and_speech)',
      provider: 'Hugging Face'
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
    model: 'CLAP (laion/larger_clap_music_and_speech)',
    provider: 'Hugging Face',
    description: 'Contrastive Language-Audio Pretraining for music analysis',
    maxFileSize: '10MB',
    supportedFormats: ['MP3', 'WAV', 'OGG', 'M4A', 'AAC'],
    capabilities: [
      'Genre classification',
      'Mood detection', 
      'Instrument identification',
      'Musical style analysis',
      'Zero-shot audio classification'
    ],
    endpoint: '/api/ai/clap-music'
  });
}