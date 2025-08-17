import { NextRequest, NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
 
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🔐 Audio presigned URL endpoint called');
    
    const body = (await request.json()) as HandleUploadBody;
    console.log('📦 Request body received:', JSON.stringify(body, null, 2));
    
    console.log('🔐 Generating presigned URL for audio upload...');
    
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        console.log('📁 Validating file for presigned URL:', pathname);
        console.log('🔍 Client payload:', clientPayload);
        
        // Validate file type from the pathname
        const allowedExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
        const hasValidExtension = allowedExtensions.some(ext => 
          pathname.toLowerCase().endsWith(ext)
        );
        
        if (!hasValidExtension) {
          console.error('❌ Invalid file extension for audio:', pathname);
          throw new Error(`Invalid file type. Only audio files are allowed. File: ${pathname}`);
        }

        console.log('✅ Audio file validation passed for:', pathname);

        // Check if we have the required environment variable
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
          console.error('❌ Missing BLOB_READ_WRITE_TOKEN environment variable');
          throw new Error('Server configuration error: Missing blob storage token');
        }

        console.log('✅ Environment configuration validated');

        return {
          allowedContentTypes: [
            'audio/mp3',
            'audio/mpeg', 
            'audio/wav',
            'audio/ogg',
            'audio/m4a',
            'audio/aac'
          ],
          maximumSizeInBytes: 100 * 1024 * 1024, // 100MB
          tokenPayload: JSON.stringify({
            uploadedAt: new Date().toISOString(),
            originalFilename: pathname,
            uploadType: 'client-upload-large-file',
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('✅ Blob upload completed via presigned URL:', blob.url);
        
        try {
          const payload = JSON.parse(tokenPayload || '{}');
          console.log('📁 Upload metadata:', payload);
        } catch (error) {
          console.warn('Failed to parse token payload:', error);
        }
      },
    });
 
    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    console.error('❌ Presigned URL generation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate presigned URL' },
      { status: 400 }
    );
  }
}